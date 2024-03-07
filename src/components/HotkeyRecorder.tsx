import { useEffect, useState } from "react";
import { useRecordHotkeys } from "react-hotkeys-hook";
import { useActiveView, useHotkey } from "./AppContext";
import { IconButton } from "./IconButton";
import { icons } from "./icons";

export const HotkeyRecorder = () => {
  const { hotkey, setHotkey } = useHotkey();
  const { setActiveView } = useActiveView();
  const [keys, { start, stop, resetKeys }] = useRecordHotkeys();
  const [invalidHotkey, setInvalidHotkey] = useState(false);

  useEffect(() => {
    start();
  }, [start]);

  return (
    <>
      <div className="Header">
        <IconButton
          icon="chevronLeft"
          onClick={() => {
            setInvalidHotkey(false);
            setActiveView("notes");
            stop();
          }}
        />
      </div>
      <div className="Page HotkeyRecorder">
        <div className="HotkeyRecorderTitle">
          Press a key combination to set a new hotkey
        </div>
        <div className="HotkeyRecorderKeys">
          {(keys.size === 0 ? hotkey.split(" + ") : Array.from(keys)).map(
            (key: string) => (
              <kbd key={key}>{key}</kbd>
            ),
          )}
        </div>

        <div className="HotkeyRecorderActions">
          <button
            className="HotkeyRecorderSaveButton"
            onClick={() => {
              if (
                keys.size === 1 ||
                (keys.size > 1 &&
                  !keys.has("meta") &&
                  !keys.has("ctrl") &&
                  !keys.has("alt"))
              ) {
                setInvalidHotkey(true);
                resetKeys();
              } else {
                setHotkey(
                  keys.size === 0 ? hotkey : Array.from(keys).join(" + "),
                );
                setInvalidHotkey(false);
                setActiveView("notes");
                stop();
              }
            }}
          >
            Save
          </button>

          <button
            className="HotkeyRecorderResetButton"
            onClick={() => {
              resetKeys();
              setInvalidHotkey(false);
            }}
          >
            {icons.uturn} Reset
          </button>
        </div>
        {invalidHotkey ? (
          <div className="HotkeyRecorderWarning">
            The hotkey <strong>must include</strong> the <kbd>Meta (⌘)</kbd>,{" "}
            <kbd>Control (^)</kbd>, or <kbd>Alt (⌥)</kbd> keys.
          </div>
        ) : null}
      </div>
    </>
  );
};
