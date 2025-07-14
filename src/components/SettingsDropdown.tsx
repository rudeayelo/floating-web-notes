import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { OpenOptions, ThemeOptions } from "../types";
import {
  useActiveView,
  useDefaultOpen,
  useEnv,
  useNotes,
  useScreenshotMode,
  useTheme,
} from "../utils/hooks";
import { IconButton } from "./IconButton";
import { icons } from "./icons";

export const SettingsDropdown = () => {
  const { defaultOpen, setDefaultOpen } = useDefaultOpen();
  const { setActiveView } = useActiveView();
  const { theme, setTheme } = useTheme();
  const { setNotes } = useNotes();
  const { isDevEnv } = useEnv();
  const { setScreenshotMode } = useScreenshotMode();

  const handleNuke = async () => {
    await chrome.storage.local.clear();
    setNotes([]);
    setActiveView("notes");
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton icon="menu" id="Settings" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content className="DropdownMenuContent" align="end">
        <DropdownMenu.Label className="DropdownMenuLabel">
          Open by default
        </DropdownMenu.Label>

        <DropdownMenu.RadioGroup
          value={defaultOpen}
          onValueChange={(open) => setDefaultOpen(open as OpenOptions)}
        >
          <DropdownMenu.RadioItem
            className="DropdownMenuRadioItem"
            id="open-default-option-never"
            value="never"
            onSelect={(evt: Event) => evt.preventDefault()}
          >
            <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
              {icons.check}
            </DropdownMenu.ItemIndicator>
            Never
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem
            className="DropdownMenuRadioItem"
            id="open-default-option-always"
            value="always"
            onSelect={(evt: Event) => evt.preventDefault()}
          >
            <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
              {icons.check}
            </DropdownMenu.ItemIndicator>
            On every website
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem
            className="DropdownMenuRadioItem"
            id="open-default-option-with-notes"
            value="with-notes"
            onSelect={(evt: Event) => evt.preventDefault()}
          >
            <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
              {icons.check}
            </DropdownMenu.ItemIndicator>
            Only when there's a note
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>

        <DropdownMenu.Separator className="DropdownMenuSeparator" />

        {isDevEnv ? (
          <>
            <DropdownMenu.Label className="DropdownMenuLabel">
              Theme
            </DropdownMenu.Label>

            <DropdownMenu.RadioGroup
              value={theme}
              onValueChange={(theme) => setTheme(theme as ThemeOptions)}
            >
              <DropdownMenu.RadioItem
                className="DropdownMenuRadioItem"
                value="light"
                onSelect={(evt: Event) => evt.preventDefault()}
              >
                <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                  {icons.check}
                </DropdownMenu.ItemIndicator>
                Light
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem
                className="DropdownMenuRadioItem"
                value="dark"
                onSelect={(evt: Event) => evt.preventDefault()}
              >
                <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                  {icons.check}
                </DropdownMenu.ItemIndicator>
                Dark
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem
                className="DropdownMenuRadioItem"
                value="system"
                onSelect={(evt: Event) => evt.preventDefault()}
              >
                <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                  {icons.check}
                </DropdownMenu.ItemIndicator>
                System
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>

            <DropdownMenu.Separator className="DropdownMenuSeparator" />
          </>
        ) : null}

        <DropdownMenu.Item
          className="DropdownMenuItem"
          onClick={() => setActiveView("help")}
          id="HelpMenuItem"
        >
          Help
        </DropdownMenu.Item>

        {isDevEnv ? (
          <>
            <DropdownMenu.Separator className="DropdownMenuSeparator" />
            <DropdownMenu.Item
              className="DropdownMenuItem"
              onSelect={() => setScreenshotMode(true)}
            >
              Screenshot Mode
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="DropdownMenuItem"
              onSelect={handleNuke}
            >
              Nuke (Remove all notes)
            </DropdownMenu.Item>
          </>
        ) : null}

        <DropdownMenu.Arrow className="DropdownMenuArrow" />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
