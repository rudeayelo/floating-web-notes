import { useEffect, useRef } from "react";
import { useNotesStore } from "../store";
import { Alerts } from "./Alerts";
import { CreateNoteState } from "./CreateNoteState";
import { Header } from "./Header";
import { NoteEditor } from "./NoteEditor";
import { ScrollArea } from "./ScrollArea";

export const Notes = () => {
  const notesRef = useRef(useNotesStore.getState().notes);
  const notesKey = useNotesStore((state) => state.notesKey);

  useEffect(() => {
    const unsubscribe = useNotesStore.subscribe((state) => {
      notesRef.current = state.notes;
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <Header />

      <ScrollArea>
        <div className="Page" key={notesKey}>
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
