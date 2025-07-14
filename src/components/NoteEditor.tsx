import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import ContentEditable from "react-contenteditable";
import sanitizeHtml from "sanitize-html";
import { useDebouncedCallback } from "use-debounce";
import type { Note } from "../types";
import { globToRegExp } from "../utils/globToRegExp";
import { useNotesById } from "../utils/hooks";
import { IconButton } from "./IconButton";
import { icons } from "./icons";

export type NoteProps = ComponentProps<"div"> & Note;

export const defaultText = "<p>&#8203;</p>";

export const NoteEditor = ({
  id,
  text = defaultText,
  pattern,
  ...props
}: NoteProps) => {
  const { setNotesById } = useNotesById();
  const editorRef = useRef();
  const [noteText, setNoteText] = useState(text);
  const [URLPattern, setURLPattern] = useState(pattern);
  const [URLPatternWarning, setURLPatternWarning] = useState(false);

  useEffect(() => {
    if (editorRef.current && "focus" in editorRef.current) {
      (editorRef.current as HTMLDivElement).focus();

      document.getSelection()?.modify("move", "forward", "documentboundary");
    }
  }, []);

  const handleRemoveNote = async () => {
    await chrome.storage.local.remove(id);

    const { notesById } = await chrome.storage.local.get("notesById");
    const updatedNotesById = notesById.filter(
      (noteId: string) => noteId !== id,
    );
    await chrome.storage.local.set({ notesById: updatedNotesById });

    setNotesById(notesById);
  };

  const handleInput = useDebouncedCallback(
    async (text) => {
      const sanitizedText = sanitizeHtml(text, {
        allowedTags: ["b", "i", "em", "strong", "p", "u", "a"],
        allowedAttributes: { a: ["href"] },
      });

      await chrome.storage.local.set({
        [id]: {
          id,
          pattern: URLPattern,
          text: sanitizedText,
        },
      });

      const textContent = sanitizedText.replace(/<[^>]*>/g, "").trim();
      const textIsEmpty = textContent.length === 0 || textContent === "​";

      setNoteText(textIsEmpty ? defaultText : text);
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

    await chrome.storage.local.set({
      [id]: {
        id,
        pattern: URLPattern,
        text: sanitizeHtml(note[id].text, {
          allowedTags: ["b", "i", "em", "strong", "p", "u", "a"],
          allowedAttributes: { a: ["href"] },
        }),
      },
    });

    const { notesById } = await chrome.storage.local.get("notesById");
    setNotesById(notesById);
  };

  const resetURLPattern = () => {
    setURLPattern(pattern);
    setURLPatternWarning(false);
  };

  return (
    <div className="Note" data-note-id={id} {...props}>
      <ContentEditable
        className="NoteEditor"
        tagName="pre"
        html={noteText}
        onChange={(evt) => handleInput(evt.target.value)}
        tabIndex={-1}
        innerRef={editorRef as unknown as React.RefObject<HTMLDivElement>}
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
