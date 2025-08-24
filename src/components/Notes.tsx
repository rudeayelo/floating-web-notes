import { useEffect, useRef, useState } from "react";
import { useNotesStore } from "../store";
import { Alerts } from "./Alerts";
import { CreateNoteState } from "./CreateNoteState";
import { Header } from "./Header";
import { NoteEditor } from "./NoteEditor";
import { ScrollArea } from "./ScrollArea";

export const Notes = () => {
  const notesRef = useRef(useNotesStore.getState().notes);
  const notes = useNotesStore((state) => state.notes);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const unsubscribe = useNotesStore.subscribe((state) => {
      notesRef.current = state.notes;
    });
    return () => unsubscribe();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Intended behaviour
  useEffect(() => {
    setKey((prevKey) => prevKey + 1);
  }, [notes]);

  return (
    <>
      <Header />

      <ScrollArea>
        <div className="Page" key={key}>
          <Alerts />
          {notesRef.current?.length > 0 ? (
            notesRef.current.map((props) => (
              <NoteEditor key={props.id} {...props} />
            ))
          ) : (
            <CreateNoteState />
          )}
        </div>
      </ScrollArea>
    </>
  );
};
