import { useState } from "react";
import { Api } from "../api";
import { useSettingsStore, useUIStore } from "../store";
import { Hotkey } from "./Hotkey";
import { icons } from "./icons";

export const Alerts = () => {
  const firstTimeNoticeAck = useUIStore((state) => state.firstTimeNoticeAck);
  const closeFirstTimeNotice = useUIStore(
    (state) => state.closeFirstTimeNotice,
  );
  const hotkey = useSettingsStore((state) => state.hotkey);
  const hotkeyConflict = useSettingsStore((state) => state.hotkeyConflict);
  const [reloading, setReloading] = useState(false);

  const openExtensionPage = () => Api.do.openExtensionPage();

  const closeHotkeyConflictAlert = async () => {
    setReloading(true);

    setTimeout(() => {
      window.location.reload();
    }, 3000);

    Api.do.reloadExtension();
  };

  return (
    <>
      {hotkeyConflict ? (
        <div className="Alert HotkeyError">
          <p>
            The <strong>Floating Web Notes</strong> keyboard shortcut couldn't
            be set. Please visit your{" "}
            <button
              type="button"
              className="ButtonLink"
              onClick={openExtensionPage}
            >
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
              type="button"
              className="ButtonLink BrowserExtensionSettings"
              onClick={openExtensionPage}
            >
              browser's extension settings
            </button>
            .
          </p>
          <button
            type="button"
            className="AlertActionButton"
            onClick={closeFirstTimeNotice}
          >
            {icons.check} Got it!
          </button>
        </div>
      ) : null}
    </>
  );
};
