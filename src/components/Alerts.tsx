import { useMemo, useState } from "react";
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
  const previousVersion = useSettingsStore((state) => state.previousVersion);
  const setPreviousVersion = useSettingsStore(
    (state) => state.setPreviousVersion,
  );
  const [reloading, setReloading] = useState(false);
  // no local dismissed state; dismissal updates previousVersion in storage

  const openExtensionPage = () => Api.do.openExtensionPage();

  const closeHotkeyConflictAlert = async () => {
    setReloading(true);

    setTimeout(() => {
      window.location.reload();
    }, 3000);

    Api.do.reloadExtension();
  };

  // Pinned changelog version (major.minor.patch.subpatch); bump when adding new changelog notes
  const PINNED_CHANGELOG_VERSION = "0.1.0.0" as const;
  const showChangelog = useMemo(() => {
    // Default: don't show on first install or if no stored version
    if (!previousVersion) return false;
    const toParts4 = (v: string) => {
      const parts = v.split(".").map((n) => parseInt(n, 10));
      const [a = 0, b = 0, c = 0, d = 0] = parts;
      return [
        Number.isNaN(a) ? 0 : a,
        Number.isNaN(b) ? 0 : b,
        Number.isNaN(c) ? 0 : c,
        Number.isNaN(d) ? 0 : d,
      ] as const;
    };
    const [ma, mi, pa, sp] = toParts4(previousVersion);
    const [pma, pmi, ppa, psp] = toParts4(PINNED_CHANGELOG_VERSION);

    if (ma !== pma) return ma < pma;
    if (mi !== pmi) return mi < pmi;
    if (pa !== ppa) return pa < ppa;
    return sp < psp;
  }, [previousVersion, PINNED_CHANGELOG_VERSION]);

  return (
    <div className="Alerts">
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
      {showChangelog ? (
        <div className="Alert Changelog">
          <div className="AlertHeader">
            <h5 className="AlertHeading">
              {icons.inbox}
              <span>
                New
                <em>!</em>
              </span>
            </h5>

            <button
              type="button"
              className="IconButton"
              onClick={async () => {
                // Persist and update store; showChangelog will recompute to false
                await setPreviousVersion(PINNED_CHANGELOG_VERSION);
              }}
            >
              {icons.close}
            </button>
          </div>
          <p>
            You can now fix the position of the notes panel by dragging it to a
            new location on the page using the handle at the top of the panel.
          </p>
        </div>
      ) : null}
    </div>
  );
};
