import { RichTextKit, TypistEditor } from "@doist/typist";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useNotesStore } from "../store";
import type { Note } from "../types";
import { NoteFooter } from "./NoteEditor.Footer";

export type NoteProps = ComponentProps<"div"> &
  Note & {
    onRemove?: () => void;
  };

export const defaultText = "&#8203;";

export const NoteEditor = ({
  id,
  text = defaultText,
  pattern,
  onRemove,
  ...props
}: NoteProps) => {
  const setNote = useNotesStore((state) => state.setNote);
  const noteRef = useRef<HTMLDivElement>(null);

  const handleInput = useDebouncedCallback(
    async (text) => await setNote({ id, pattern, text }),
    600,
    { maxWait: 1000 },
  );

  useEffect(() => {
    const editor = noteRef.current?.querySelector("[data-typist-editor]");
    if (!editor) return;

    const stopKeyboardPropagation = (event: Event) => {
      event.stopPropagation();
    };
    const keyboardEvents = ["keydown", "keypress", "keyup"];

    for (const eventName of keyboardEvents) {
      editor.addEventListener(eventName, stopKeyboardPropagation, {
        capture: true,
      });
    }

    return () => {
      for (const eventName of keyboardEvents) {
        editor.removeEventListener(eventName, stopKeyboardPropagation, {
          capture: true,
        });
      }
    };
  }, []);

  return (
    <div className="Note" data-note-id={id} ref={noteRef} {...props}>
      <TypistEditor
        className="NoteEditor"
        content={text}
        extensions={[RichTextKit]}
        onUpdate={(content) => {
          handleInput(content.getMarkdown());
        }}
        autoFocus={true}
      />

      <NoteFooter id={id} pattern={pattern} onRemove={onRemove} />
    </div>
  );
};
