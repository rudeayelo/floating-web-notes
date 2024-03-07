import { nanoid } from "nanoid";
import { icons } from "./icons";
import { useHotkey, useNotesById } from "./AppContext";
import { useHotkeys } from "react-hotkeys-hook";
import { useEffect, useState } from "react";
import React from "react";

export const CreateNoteState = () => {
  const { setNotesById } = useNotesById();
  const { hotkey } = useHotkey();
  const [firstTimeNoticeAck, setFirstTimeNoticeAck] = useState(false);

  useEffect(() => {
    const checkFirstTimeNoticeAck = async () => {
      const { firstTimeNoticeAck } =
        await chrome.storage.local.get("firstTimeNoticeAck");

      if (firstTimeNoticeAck) setFirstTimeNoticeAck(true);
    };

    checkFirstTimeNoticeAck();
  }, []);

  useHotkeys("shift + enter", async () => await createNote({ exact: true }));
  useHotkeys("enter", async () => await createNote());

  const closeFirstTimeNotice = async () => {
    setFirstTimeNoticeAck(true);
    await chrome.storage.local.set({ firstTimeNoticeAck: true });
  };

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

    const newNotesById =
      notesById && notesById.length ? [...notesById, id] : [id];

    await chrome.storage.local.set({ [id]: newNote });
    await chrome.storage.local.set({ notesById: newNotesById });

    setNotesById(newNotesById);
  };

  return (
    <>
      {!firstTimeNoticeAck ? (
        <div className="FirstTimeGuide">
          <p>
            <strong>Floating Web Notes</strong> is invoked by pressing the{" "}
            {hotkey.split(" + ").map((key, idx) => (
              <React.Fragment key={key}>
                <kbd>{key}</kbd>
                {idx <= hotkey.split(" + ").length - 2 && " + "}
              </React.Fragment>
            ))}{" "}
            hotkey. You can change it by clicking on <em>Modify hotkey</em> in
            the{" "}
            <span className="Icon" style={{ color: "var(--gray-11)" }}>
              {icons.menu}
            </span>{" "}
            menu.
          </p>
          <button
            className="FirstTimeGuideCloseButton"
            onClick={closeFirstTimeNotice}
          >
            {icons.check} Got it!
          </button>
        </div>
      ) : null}
      <div className="EmptyNotesLabel">Add a new note…</div>
      <button
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
