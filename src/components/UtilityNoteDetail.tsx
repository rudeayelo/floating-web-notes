import { useEffect, useState } from "react";
import { useNotesStore } from "../store";
import type { Note } from "../types";
import { NoteEditor } from "./NoteEditor";

type UtilityNoteDetailProps = {
  noteId: string;
  onRemove: () => void;
  onMissingNote: () => void;
};

export const UtilityNoteDetail = ({
  noteId,
  onRemove,
  onMissingNote,
}: UtilityNoteDetailProps) => {
  const getNote = useNotesStore((state) => state.getNote);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadNote = async () => {
      try {
        const nextNote = await getNote(noteId);
        if (cancelled) return;

        if (!nextNote) {
          onMissingNote();
          return;
        }

        setNote(nextNote);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadNote();

    return () => {
      cancelled = true;
    };
  }, [getNote, noteId, onMissingNote]);

  if (loading) {
    return <p className="UtilityStatus">Loading note...</p>;
  }

  if (!note) {
    return null;
  }

  return (
    <div className="UtilityNoteDetail" id="UtilityNoteDetail">
      <NoteEditor {...note} onRemove={onRemove} />
    </div>
  );
};
