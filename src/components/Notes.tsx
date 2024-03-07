import { useNotes } from "./AppContext";
import { CreateNoteState } from "./CreateNoteState";
import { Header } from "./Header";
import { NoteEditor } from "./NoteEditor";
import { ScrollArea } from "./ScrollArea";

export const Notes = () => {
  const { notes } = useNotes();

  return (
    <>
      <Header />

      <ScrollArea>
        <div className="Page">
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
