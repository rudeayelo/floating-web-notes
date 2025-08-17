import { create } from "zustand";
import { Api } from "../api";
import type { Note } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";

type NotesState = {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  setNote: (note: Note) => void;
  notesById: string[];
  setNotesById: (notesById: string[]) => void;
  updateNotes: () => Promise<void>;
};

export const useNotesStore = create<NotesState>((set) => ({
  /* -------------------------------------------------------------------------- */
  /*                                   Notes                                    */
  /* -------------------------------------------------------------------------- */
  notes: [],
  setNotes: (notes: Note[]) => set({ notes }),
  setNote: (note: Note) => {
    Api.set.note(note);
    set((state) => {
      const notes = state.notes.map((n) => (n.id === note.id ? note : n));
      return { notes };
    });
  },

  /* -------------------------------------------------------------------------- */
  /*                                Notes By ID                                 */
  /* -------------------------------------------------------------------------- */
  notesById: [],
  setNotesById: (notesById: string[]) => set({ notesById }),

  /* -------------------------------------------------------------------------- */
  /*                               Update Notes                                 */
  /* -------------------------------------------------------------------------- */
  updateNotes: async () => {
    const currentNotes = await getCurrentWebNotes();
    set({ notes: currentNotes });
  },
}));
