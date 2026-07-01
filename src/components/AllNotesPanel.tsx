import { useEffect, useState } from "react";
import { Api } from "../api";
import type { Note } from "../types";
import { icons } from "./icons";
import { NotePreview } from "./NotePreview";
import { ScrollArea } from "./ScrollArea";

type AllNotesPanelProps = {
  onSelectNote: (id: string) => void;
  refreshKey?: number;
};

export const AllNotesPanel = ({
  onSelectNote,
  refreshKey = 0,
}: AllNotesPanelProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshKey;
    let cancelled = false;

    const loadNotes = async () => {
      try {
        const allNotes = await Api.get.allNotes();
        if (cancelled) return;

        setNotes(allNotes);
        setError(null);
      } catch (loadError) {
        if (cancelled) return;

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load notes.";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadNotes();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="AllNotesPanel UtilityPanelContent" id="AllNotesPanel">
      <ScrollArea
        className="UtilityScrollArea"
        viewportClassName="UtilityScrollAreaViewport"
      >
        <div className="UtilityResults" aria-live="polite">
          {loading ? (
            <p className="UtilityStatus">Loading notes...</p>
          ) : error ? (
            <p className="UtilityStatus" data-state="error">
              {error}
            </p>
          ) : notes.length > 0 ? (
            notes.map((note) => (
              <button
                type="button"
                className="UtilityResult"
                key={note.id}
                onClick={() => onSelectNote(note.id)}
              >
                <div className="UtilityResultPattern">
                  {icons.globe}
                  <span>{note.pattern}</span>
                </div>
                <NotePreview text={note.text} />
              </button>
            ))
          ) : (
            <p className="UtilityStatus">No notes yet.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
