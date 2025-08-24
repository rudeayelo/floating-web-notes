import { RichTextKit, TypistEditor } from "@doist/typist";
import type { ComponentProps } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useNotesStore } from "../store";
import type { Note } from "../types";
import { NoteFooter } from "./NoteEditor.Footer";

export type NoteProps = ComponentProps<"div"> & Note;

export const defaultText = "&#8203;";

export const NoteEditor = ({
  id,
  text = defaultText,
  pattern,
  ...props
}: NoteProps) => {
  const setNote = useNotesStore((state) => state.setNote);
  const removeNote = useNotesStore((state) => state.removeNote);

  const handleRemoveNote = async () => {
    await removeNote(id);
  };

  const handleInput = useDebouncedCallback(
    async (text) => await setNote({ id, pattern, text }),
    600,
    { maxWait: 1000 },
  );

  return (
    <div className="Note" data-note-id={id} {...props}>
      <TypistEditor
        className="NoteEditor"
        content={text}
        extensions={[RichTextKit]}
        onUpdate={(content) => {
          handleInput(content.getMarkdown());
        }}
        autoFocus={true}
      />

      <NoteFooter id={id} pattern={pattern} onRemoveNote={handleRemoveNote} />
    </div>
  );
};
