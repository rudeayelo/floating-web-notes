import { RichTextKit, TypistEditor } from "@doist/typist";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Api } from "../api";
import { useNotesStore } from "../store";
import type { Note } from "../types";
import { globToRegExp } from "../utils/globToRegExp";
import { IconButton } from "./IconButton";
import { icons } from "./icons";

export type NoteProps = ComponentProps<"div"> & Note;

export const defaultText = "&#8203;";

export const NoteEditor = ({
  id,
  text = defaultText,
  pattern,
  ...props
}: NoteProps) => {
  const setNotesById = useNotesStore((state) => state.setNotesById);
  const editorRef = useRef(null);
  const [URLPattern, setURLPattern] = useState(pattern);
  const [URLPatternWarning, setURLPatternWarning] = useState(false);

  useEffect(() => {
    if (editorRef.current && "focus" in editorRef.current) {
      (editorRef.current as HTMLDivElement).focus();

      document.getSelection()?.modify("move", "forward", "documentboundary");
    }
  }, []);

  const handleRemoveNote = async () => {
    Api.remove.note(id);

    const notesById = await Api.get.notesById();
    const updatedNotesById = notesById.filter(
      (noteId: string) => noteId !== id,
    );
    await Api.set.notesById(updatedNotesById);

    setNotesById(notesById);
  };

  const handleInput = useDebouncedCallback(
    async (text) => {
      Api.set.note({ id, pattern: URLPattern, text });
    },
    600,
    { maxWait: 1000 },
  );

  const handleURLPatternChange = (value: string) => {
    const rgx = globToRegExp(`*${value}`);

    setURLPatternWarning(!rgx.test(location.href));
    setURLPattern(value);
  };

  const handleURLPatternSave = async () => {
    const note = await chrome.storage.local.get(`${id}`);

    Api.set.note({
      id,
      pattern: URLPattern,
      text: note[id].text,
    });

    const notesById = await Api.get.notesById();
    setNotesById(notesById);
  };

  const resetURLPattern = () => {
    setURLPattern(pattern);
    setURLPatternWarning(false);
  };

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

      <div className="NoteFooter">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button type="button" className="GhostButton URLPatternButton">
              {icons.globe}{" "}
              <span className="URLPatternButtonText">{URLPattern}</span>
            </button>
          </Popover.Trigger>
          <Popover.Content
            className="PopoverContent"
            onInteractOutside={resetURLPattern}
          >
            <div className="Form">
              <div className="FormControl">
                <input
                  className="URLPatternInput Input"
                  id="url-pattern"
                  defaultValue={URLPattern}
                  onChange={(evt) => handleURLPatternChange(evt.target.value)}
                />
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className="TooltipTriggerIcon">{icons.info}</div>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="TooltipContent" sideOffset={4}>
                    The wildcard symbol (<code>*</code>) matches
                    <br />
                    any character any number of times
                    <Tooltip.Arrow className="TooltipArrow" />
                  </Tooltip.Content>
                </Tooltip.Root>
              </div>
              <Popover.Close aria-label="Save" asChild>
                <button
                  type="button"
                  className="URLPatternSaveButton"
                  onClick={handleURLPatternSave}
                >
                  Save
                </button>
              </Popover.Close>
            </div>
            {URLPatternWarning ? (
              <div className="InputHelper" data-state="error">
                This pattern won't match the current tab,{" "}
                <Popover.Close aria-label="Undo changes" asChild>
                  <button
                    type="button"
                    className="URLPatternUndoChangeButton"
                    onClick={resetURLPattern}
                  >
                    undo?
                  </button>
                </Popover.Close>
              </div>
            ) : null}

            <Popover.Arrow className="PopoverArrow" />
          </Popover.Content>
        </Popover.Root>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <IconButton
              icon="remove"
              variant="danger"
              onClick={handleRemoveNote}
              className="RemoveNoteButton"
            />
          </Tooltip.Trigger>
          <Tooltip.Content
            className="TooltipContent"
            data-variant="danger"
            sideOffset={4}
          >
            Remove note
            <Tooltip.Arrow className="TooltipArrow" />
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>
  );
};
