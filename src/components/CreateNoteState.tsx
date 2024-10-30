import { nanoid } from "nanoid";
import { useHotkeys } from "react-hotkeys-hook";
import { useNotesById } from "../utils/hooks";
import { icons } from "./icons";

export const CreateNoteState = () => {
  const { setNotesById } = useNotesById();

  useHotkeys("shift + enter", async () => await createNote({ exact: true }));
  useHotkeys("enter", async () => await createNote());

  const createNote = async (options?: { exact: boolean }) => {
    const { notesById } = await chrome.storage.local.get("notesById");

    const id = nanoid();
    const pattern = options?.exact
      ? location.href.replace(/^(https?:\/\/)?/, "").replace(/#.*/, "*")
      : `${location.host}*`;
    const newNote = {
      id,
      text: undefined,
      pattern,
    };

    const newNotesById = notesById?.length ? [...notesById, id] : [id];

    await chrome.storage.local.set({ [id]: newNote });
    await chrome.storage.local.set({ notesById: newNotesById });

    setNotesById(newNotesById);
  };

  return (
    <>
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
    </>
  );
};
