import { useState } from "react";
import { icons } from "./icons";
import { useFirstTimeNoticeAck, useHotkey } from "../utils/hooks";
import { Hotkey } from "./Hotkey";

export const Alerts = () => {
  const { firstTimeNoticeAck, closeFirstTimeNotice } = useFirstTimeNoticeAck();
  const { hotkey, hotkeyConflict } = useHotkey();
  const [reloading, setReloading] = useState(false);

  const openExtensionPage = () =>
    chrome.runtime.sendMessage({
      type: "openExtensionPage",
    });

  const closeHotkeyConflictAlert = async () => {
    setReloading(true);

    setTimeout(() => {
      window.location.reload();
    }, 3000);

    chrome.runtime.sendMessage({ type: "reloadExtension" });
  };

  return (
    <>
      {hotkeyConflict ? (
        <div className="Alert HotkeyError">
          <p>
            The <strong>Floating Web Notes</strong> keyboard shortcut couldn't
            be set. Please visit your{" "}
            <button className="ButtonLink" onClick={openExtensionPage}>
              browser's extension settings
            </button>{" "}
            to change it.
          </p>
          <button
            className="AlertActionButton"
            onClick={closeHotkeyConflictAlert}
            {...(reloading ? { "data-reloading": true } : null)}
          >
            {reloading ? icons.reload : icons.check}{" "}
            {reloading ? "Reloading..." : "Done!"}
          </button>
        </div>
      ) : null}
      {!firstTimeNoticeAck && !hotkeyConflict && !!hotkey ? (
        <div className="Alert FirstTimeGuide">
          <p>
            <strong>Floating Web Notes</strong> is invoked by pressing the{" "}
            <Hotkey>{hotkey}</Hotkey> keyboard shortcut. You can change it in
            your{" "}
            <button
              className="ButtonLink BrowserExtensionSettings"
              onClick={openExtensionPage}
            >
              browser's extension settings
            </button>
            .
          </p>
          <button className="AlertActionButton" onClick={closeFirstTimeNotice}>
            {icons.check} Got it!
          </button>
        </div>
      ) : null}
    </>
  );
};
