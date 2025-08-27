import { Popover } from "@base-ui-components/react/popover";
import { Tooltip } from "@base-ui-components/react/tooltip";
import { useCallback, useState } from "react";
import { useNotesStore, useUIStore } from "../store";
import { urlMatchesPattern } from "../utils/urls";
import { IconButton } from "./IconButton";
import { icons } from "./icons";

interface NoteFooterProps {
  id: string;
  pattern: string;
}

export const NoteFooter = ({ id, pattern }: NoteFooterProps) => {
  const setNote = useNotesStore((state) => state.setNote);
  const getNote = useNotesStore((state) => state.getNote);
  const updateNotes = useNotesStore((state) => state.updateNotes);
  const forceNotesUpdate = useNotesStore((state) => state.forceNotesUpdate);
  const [URLPattern, setURLPattern] = useState(pattern);
  const [URLPatternWarning, setURLPatternWarning] = useState(false);
  const rootRef = useUIStore((state) => state.rootRef);
  const removeNote = useNotesStore((state) => state.removeNote);

  const onRemoveNote = async () => {
    await removeNote(id);
    forceNotesUpdate();
  };

  const handleURLPatternChange = useCallback((pattern: string) => {
    setURLPatternWarning(!urlMatchesPattern({ pattern }));
    setURLPattern(pattern);
  }, []);

  const handleURLPatternSave = async () => {
    const note = await getNote(id);
    await setNote({
      id,
      pattern: URLPattern,
      text: note.text,
    });
    await updateNotes();
    forceNotesUpdate();
  };

  const resetURLPattern = () => {
    setURLPattern(pattern);
    setURLPatternWarning(false);
  };

  return (
    <div className="NoteFooter">
      <Popover.Root>
        <Popover.Trigger
          render={
            <button type="button" className="GhostButton URLPatternButton">
              {icons.globe}{" "}
              <span className="URLPatternButtonText">{pattern}</span>
            </button>
          }
        />
        <Popover.Portal container={rootRef}>
          <Popover.Positioner sideOffset={4}>
            <Popover.Popup className="PopoverContent">
              <div className="Form">
                <div className="FormControl">
                  <input
                    className="URLPatternInput Input"
                    id="url-pattern"
                    defaultValue={URLPattern}
                    onChange={(evt) => handleURLPatternChange(evt.target.value)}
                  />
                  <Tooltip.Root delay={0}>
                    <Tooltip.Trigger
                      render={
                        <div className="TooltipTriggerIcon">{icons.info}</div>
                      }
                    />
                    <Tooltip.Portal container={rootRef}>
                      <Tooltip.Positioner sideOffset={4}>
                        <Tooltip.Popup className="TooltipContent">
                          The wildcard symbol (<code>*</code>) matches
                          <br />
                          any character any number of times
                          <Tooltip.Arrow className="TooltipArrow">
                            {icons.popArrow}
                          </Tooltip.Arrow>
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
                <Popover.Close
                  aria-label="Save"
                  render={
                    <button
                      type="button"
                      className="URLPatternSaveButton"
                      onClick={handleURLPatternSave}
                    >
                      Save
                    </button>
                  }
                />
              </div>
              {URLPatternWarning ? (
                <div className="InputHelper" data-state="error">
                  This pattern won't match the current tab,{" "}
                  <Popover.Close
                    aria-label="Undo changes"
                    render={
                      <button
                        type="button"
                        className="URLPatternUndoChangeButton"
                        onClick={resetURLPattern}
                      >
                        undo?
                      </button>
                    }
                  />
                </div>
              ) : null}

              <Popover.Arrow className="PopoverArrow" />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <Tooltip.Root delay={0}>
        <Tooltip.Trigger
          render={
            <IconButton
              icon="remove"
              variant="danger"
              onClick={onRemoveNote}
              className="RemoveNoteButton"
            />
          }
        />
        <Tooltip.Portal container={rootRef}>
          <Tooltip.Positioner sideOffset={4}>
            <Tooltip.Popup className="TooltipContent" data-variant="danger">
              Remove note
              <Tooltip.Arrow className="TooltipArrow">
                {icons.popArrow}
              </Tooltip.Arrow>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
};
