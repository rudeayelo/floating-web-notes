import { create } from "zustand";
import { Api } from "../api";
import type { Note } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";

type NotesState = {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  setNote: (note: Note) => void;
  getNote: (id: string) => Promise<Note>;
  removeNote: (id: string) => Promise<void>;
  updateNotes: () => Promise<void>;
  notesKey: number | null;
  forceNotesUpdate: () => void;
};

export const useNotesStore = create<NotesState>((set) => ({
  /* -------------------------------------------------------------------------- */
  /*                                   Notes                                    */
  /* -------------------------------------------------------------------------- */
  notes: [],
  setNotes: (notes: Note[]) => set({ notes }),
  setNote: async (note: Note) => {
    // Persist to storage (background ensures notesById contains the id)
    await Api.set.note(note);

    // Sync local state: update note content and refresh notesById from storage
    const latestIds = await Api.get.notesById();
    set((state) => {
      const exists = state.notes.some((n) => n.id === note.id);

      if (exists) {
        const notes = state.notes.map((n) => (n.id === note.id ? note : n));
        return { notes };
      }

      const notes = [...state.notes, note];
      return { notes, notesById: latestIds };
    });
  },
  getNote: async (id: string) => {
    return Api.get.note(id);
  },
  removeNote: async (id: string) => {
    await Api.remove.note(id);
    const latestIds = await Api.get.notesById();
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      notesById: latestIds,
    }));
  },
  notesKey: null,
  forceNotesUpdate: () => {
    set({ notesKey: Date.now() });
  },

  /* -------------------------------------------------------------------------- */
  /*                               Update Notes                                 */
  /* -------------------------------------------------------------------------- */
  updateNotes: async () => {
    const currentNotes = await getCurrentWebNotes();
    set({ notes: currentNotes });
  },
}));
