import { Menu } from "@base-ui-components/react/menu";
import { useNotesStore, useSettingsStore, useUIStore } from "../store";
import type { OpenOptions, ThemeOptions } from "../types";
import { useEnv } from "../utils/hooks";
import { IconButton } from "./IconButton";
import { icons } from "./icons";

export const SettingsDropdown = () => {
  const defaultOpen = useSettingsStore((state) => state.defaultOpen);
  const setDefaultOpen = useSettingsStore((state) => state.setDefaultOpen);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const setScreenshotMode = useUIStore((state) => state.setScreenshotMode);
  const setNotes = useNotesStore((state) => state.setNotes);
  const { isDevEnv } = useEnv();

  const handleNuke = async () => {
    await chrome.storage.local.clear();
    setNotes([]);
    setActiveView("notes");
  };

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger render={<IconButton icon="menu" id="Settings" />} />

      <Menu.Portal
        container={document.querySelector("floating-web-notes")?.shadowRoot}
      >
        <Menu.Positioner align="end">
          <Menu.Popup className="DropdownMenuContent">
            <Menu.Group>
              <Menu.GroupLabel className="DropdownMenuLabel">
                Open by default
              </Menu.GroupLabel>

              <Menu.RadioGroup
                value={defaultOpen}
                onValueChange={(open) => setDefaultOpen(open as OpenOptions)}
              >
                <Menu.RadioItem
                  className="DropdownMenuRadioItem"
                  id="open-default-option-never"
                  value="never"
                >
                  <Menu.RadioItemIndicator className="DropdownMenuItemIndicator">
                    {icons.check}
                  </Menu.RadioItemIndicator>
                  Never
                </Menu.RadioItem>
                <Menu.RadioItem
                  className="DropdownMenuRadioItem"
                  id="open-default-option-always"
                  value="always"
                >
                  <Menu.RadioItemIndicator className="DropdownMenuItemIndicator">
                    {icons.check}
                  </Menu.RadioItemIndicator>
                  On every website
                </Menu.RadioItem>
                <Menu.RadioItem
                  className="DropdownMenuRadioItem"
                  id="open-default-option-with-notes"
                  value="with-notes"
                >
                  <Menu.RadioItemIndicator className="DropdownMenuItemIndicator">
                    {icons.check}
                  </Menu.RadioItemIndicator>
                  Only when there's a note
                </Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Group>

            <Menu.Separator className="DropdownMenuSeparator" />

            {isDevEnv ? (
              <>
                <Menu.Group>
                  <Menu.GroupLabel className="DropdownMenuLabel">
                    Theme
                  </Menu.GroupLabel>

                  <Menu.RadioGroup
                    value={theme}
                    onValueChange={(theme) => setTheme(theme as ThemeOptions)}
                  >
                    <Menu.RadioItem
                      className="DropdownMenuRadioItem"
                      value="light"
                    >
                      <Menu.RadioItemIndicator className="DropdownMenuItemIndicator">
                        {icons.check}
                      </Menu.RadioItemIndicator>
                      Light
                    </Menu.RadioItem>
                    <Menu.RadioItem
                      className="DropdownMenuRadioItem"
                      value="dark"
                    >
                      <Menu.RadioItemIndicator className="DropdownMenuItemIndicator">
                        {icons.check}
                      </Menu.RadioItemIndicator>
                      Dark
                    </Menu.RadioItem>
                    <Menu.RadioItem
                      className="DropdownMenuRadioItem"
                      value="system"
                    >
                      <Menu.RadioItemIndicator className="DropdownMenuItemIndicator">
                        {icons.check}
                      </Menu.RadioItemIndicator>
                      System
                    </Menu.RadioItem>
                  </Menu.RadioGroup>
                </Menu.Group>

                <Menu.Separator className="DropdownMenuSeparator" />
              </>
            ) : null}

            <Menu.Item
              className="DropdownMenuItem"
              onClick={() => setActiveView("help")}
              id="HelpMenuItem"
            >
              Help
            </Menu.Item>

            {isDevEnv ? (
              <>
                <Menu.Separator className="DropdownMenuSeparator" />
                <Menu.Item
                  className="DropdownMenuItem"
                  onClick={() => setScreenshotMode(true)}
                >
                  Screenshot Mode
                </Menu.Item>
                <Menu.Item className="DropdownMenuItem" onClick={handleNuke}>
                  Nuke (Remove all notes)
                </Menu.Item>
              </>
            ) : null}

            <Menu.Arrow className="DropdownMenuArrow" />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
