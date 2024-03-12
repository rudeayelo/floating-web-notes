import { useActiveView, useHotkey } from "../utils/hooks";
import { Alerts } from "./Alerts";
import { Hotkey } from "./Hotkey";
import { IconButton } from "./IconButton";
import { ScrollArea } from "./ScrollArea";
import { SettingsDropdown } from "./SettingsDropdown";

export const Help = () => {
  const { hotkey } = useHotkey();
  const { setActiveView } = useActiveView();

  const openExtensionPage = () =>
    chrome.runtime.sendMessage({
      type: "openExtensionPage",
    });

  return (
    <>
      <div className="Header">
        <IconButton icon="chevronLeft" onClick={() => setActiveView("notes")} />
        <SettingsDropdown />
      </div>
      <ScrollArea>
        <div className="Page">
          <Alerts />
          <div className="Help">
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <img
                src={chrome.runtime.getURL("src/assets/icon128.png")}
                width="128"
                alt="Floating Web Notes"
              />
            </div>
            <p>
              <strong>Floating Web Notes</strong> is a Chrome extension that
              lets you attach text notes to web pages.
            </p>
            <h2>How to use</h2>
            <p>
              Open it pressing the <Hotkey>{hotkey}</Hotkey> keyboard shortcut.
              You can change it in your{" "}
              <button className="ButtonLink" onClick={openExtensionPage}>
                browser's extension settings
              </button>
              .
            </p>
            <p>
              Once loaded, you can start adding your notes in plain text, it'll
              be stored in your local machine, nothing is sent to any server or
              tracked in any way.
            </p>
            <p>
              The notes you write will be attached to the website where the{" "}
              <strong>Floating Web Notes</strong> window was invoked on; notice
              the pattern below the text when the mouse cursor is over it, if
              you click on it you can edit said pattern to make it match other
              parts of the website (<strong>pro tip:</strong> it accepts a{" "}
              <a
                href="https://en.wikipedia.org/wiki/Glob_(programming)"
                title="glob in Wikipedia"
              >
                glob pattern
              </a>
              ).
            </p>
            <p>
              If multiple note patterns match a page, all matching notes will be
              shown on screen.
            </p>
            <h2>Feedback</h2>
            <p>
              This is mostly a personal project built primarily for my own
              usage, so I'll keep the feature set light, if you'd like to give
              some feedback, do it by mentioning or DMing{" "}
              <a href="https://x.com/Rude" title="Rude on X">
                @Rude on X
              </a>
              .
            </p>
          </div>
        </div>
      </ScrollArea>
    </>
  );
};
