import { useEffect, useMemo, useRef, useState } from "react";
import { Api } from "../api";
import type { Note } from "../types";
import { icons } from "./icons";
import { NotePreview } from "./NotePreview";
import { ScrollArea } from "./ScrollArea";

const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

const matchesNote = (note: Note, query: string) => {
  const normalizedText = note.text.toLowerCase();
  const normalizedPattern = note.pattern.toLowerCase();

  return normalizedText.includes(query) || normalizedPattern.includes(query);
};

type SearchNotesProps = {
  onSelectNote: (id: string) => void;
  refreshKey?: number;
};

export const SearchNotes = ({
  onSelectNote,
  refreshKey = 0,
}: SearchNotesProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const normalizedQuery = normalizeSearchValue(query);

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo<Note[]>(() => {
    if (normalizedQuery.length === 0) return [];

    return notes.filter((note) => matchesNote(note, normalizedQuery));
  }, [notes, normalizedQuery]);

  const showResults = normalizedQuery.length > 0;

  return (
    <div className="SearchPanel UtilityPanelContent" id="SearchPanel">
      <input
        ref={inputRef}
        className="SearchInput"
        id="SearchInput"
        placeholder="Search all notes"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {loading ? (
        <p className="UtilityStatus" aria-live="polite">
          Loading notes...
        </p>
      ) : error ? (
        <p className="UtilityStatus" data-state="error" aria-live="polite">
          {error}
        </p>
      ) : !showResults ? null : results.length > 0 ? (
        <ScrollArea
          className="UtilityScrollArea"
          viewportClassName="UtilityScrollAreaViewport"
        >
          <div className="UtilityResults" aria-live="polite">
            {results.map((note) => (
              <button
                type="button"
                className="UtilityResult SearchResult"
                key={note.id}
                onClick={() => onSelectNote(note.id)}
              >
                <div className="UtilityResultPattern">
                  {icons.globe}
                  <span>{note.pattern}</span>
                </div>
                <NotePreview text={note.text} />
              </button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="UtilityStatus" aria-live="polite">
          No matching notes.
        </p>
      )}
    </div>
  );
};
