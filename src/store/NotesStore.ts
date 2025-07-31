import { create } from "zustand";
import type { Note } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";

type NotesState = {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
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
