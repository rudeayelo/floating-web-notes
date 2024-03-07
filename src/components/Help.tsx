import { useActiveView, useHotkey } from "./AppContext";
import { IconButton } from "./IconButton";
import { ScrollArea } from "./ScrollArea";
import { SettingsDropdown } from "./SettingsDropdown";
import { icons } from "./icons";

export const Help = () => {
  const { hotkey } = useHotkey();
  const { setActiveView } = useActiveView();

  return (
    <>
      <div className="Header">
        <IconButton icon="chevronLeft" onClick={() => setActiveView("notes")} />
        <SettingsDropdown />
      </div>
      <ScrollArea>
        <div className="Page">
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
              It's invoked by pressing the{" "}
              {hotkey.split(" + ").map((key, idx) => (
                <span key={key}>
                  <kbd>{key}</kbd>
                  {idx <= hotkey.split(" + ").length - 2 && " + "}
                </span>
              ))}{" "}
              hotkey. You can change it using the corresponding action in the{" "}
              <span className="Icon">{icons.menu}</span> menu.
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
