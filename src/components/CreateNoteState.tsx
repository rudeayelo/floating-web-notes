import { nanoid } from "nanoid";
import { useHotkeys } from "react-hotkeys-hook";
import { useNotesStore } from "../store";
import { createExactPatternFromURL } from "../utils/urls";
import { icons } from "./icons";

export const CreateNoteState = () => {
  const setNote = useNotesStore((state) => state.setNote);

  useHotkeys("shift + enter", async () => await createNote({ exact: true }));
  useHotkeys("enter", async () => await createNote());

  const createNote = async (options?: { exact: boolean }) => {
    const id = nanoid();
    const pattern = options?.exact
      ? createExactPatternFromURL()
      : `${location.host}*`;

    await setNote({ id, text: "", pattern });
  };

  return (
    <div className="CreateNoteState">
      <div className="EmptyNotesLabel">Add a new note…</div>
      <button
        type="button"
        className="NewWholeWebsiteNote NewNoteButton"
        onClick={() => createNote()}
      >
        {icons.plus}
        <span className="NewNoteButtonText">...for this whole website </span>
        <span className="NewNoteButtonHotkey">
          <kbd>Enter</kbd>
        </span>
      </button>
      <button
        type="button"
        className="NewExactPatternNote NewNoteButton"
        onClick={() => createNote({ exact: true })}
      >
        {icons.plus}
        <span className="NewNoteButtonText">...for this exact page </span>
        <span className="NewNoteButtonHotkey">
          <kbd>Shift</kbd> + <kbd>Enter</kbd>
        </span>
      </button>
    </div>
  );
};
