import { create } from "zustand";
import { Api } from "../api";
import type {
  Note,
  NotesExport,
  NotesImportMode,
  NotesImportResult,
} from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";
import { cleanURL, urlMatchesPattern } from "../utils/urls";

let notesUpdateRequestId = 0;

type NotesState = {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  setNote: (note: Note) => Promise<void>;
  getNote: (id: string) => Promise<Note>;
  removeNote: (id: string) => Promise<void>;
  exportNotes: () => Promise<NotesExport>;
  importNotes: (
    exportData: unknown,
    mode: NotesImportMode,
  ) => Promise<NotesImportResult>;
  updateNotes: (url?: string) => Promise<void>;
  notesKey: number | null;
  forceNotesUpdate: () => void;
};

export const useNotesStore = create<NotesState>((set) => ({
  /* -------------------------------------------------------------------------- */
  /*                                   Notes                                    */
  /* -------------------------------------------------------------------------- */
  notes: [],
  setNotes: (notes: Note[]) => {
    notesUpdateRequestId += 1;
    set({ notes, notesKey: Date.now() });
  },
  setNote: async (note: Note) => {
    // Persist to storage (background ensures notesById contains the id)
    await Api.set.note(note);

    // Keep local state scoped to notes that match the current page.
    set((state) => {
      const exists = state.notes.some((n) => n.id === note.id);
      const matchesCurrentPage = urlMatchesPattern({ pattern: note.pattern });

      if (exists) {
        const notes = matchesCurrentPage
          ? state.notes.map((n) => (n.id === note.id ? note : n))
          : state.notes.filter((n) => n.id !== note.id);
        return { notes };
      }

      if (!matchesCurrentPage) {
        return state;
      }

      const notes = [...state.notes, note];
      return { notes };
    });
  },
  getNote: async (id: string) => {
    return Api.get.note(id);
  },
  removeNote: async (id: string) => {
    await Api.remove.note(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }));
  },
  exportNotes: async () => {
    return Api.get.notesExport();
  },
  importNotes: async (exportData: unknown, mode: NotesImportMode) => {
    const response = await Api.set.notesImport(exportData, mode);
    if (!response.ok) {
      throw new Error(response.error);
    }

    const currentNotes = await getCurrentWebNotes();
    set({ notes: currentNotes, notesKey: Date.now() });

    return response.result;
  },
  notesKey: null,
  forceNotesUpdate: () => {
    set({ notesKey: Date.now() });
  },

  /* -------------------------------------------------------------------------- */
  /*                               Update Notes                                 */
  /* -------------------------------------------------------------------------- */
  updateNotes: async (url = window.location.href) => {
    const requestId = ++notesUpdateRequestId;
    const pageKey = cleanURL(url);
    const currentNotes = await getCurrentWebNotes(url);

    if (
      requestId !== notesUpdateRequestId ||
      cleanURL(window.location.href) !== pageKey
    ) {
      return;
    }

    set({ notes: currentNotes, notesKey: Date.now() });
  },
}));
