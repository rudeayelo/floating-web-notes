import { useNotesStore } from "../store";
import { Alerts } from "./Alerts";
import { CreateNoteState } from "./CreateNoteState";
import { Header } from "./Header";
import { NoteEditor } from "./NoteEditor";
import { ScrollArea } from "./ScrollArea";

export const Notes = () => {
  const notes = useNotesStore((state) => state.notes);

  return (
    <>
      <Header />

      <ScrollArea>
        <div className="Page">
          <Alerts />
          {notes?.length > 0 ? (
            notes.map((props) => <NoteEditor key={props.id} {...props} />)
          ) : (
            <CreateNoteState />
          )}
        </div>
      </ScrollArea>
    </>
  );
};
