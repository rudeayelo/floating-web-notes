import { Menu } from "@base-ui/react/menu";
import { useNotesStore, useSettingsStore, useUIStore } from "../store";
import type { NotesImportMode, OpenOptions, ThemeOptions } from "../types";
import { useEnv } from "../utils/hooks";
import { IconButton } from "./IconButton";
import { icons } from "./icons";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

export const SettingsDropdown = () => {
  const defaultOpen = useSettingsStore((state) => state.defaultOpen);
  const setDefaultOpen = useSettingsStore((state) => state.setDefaultOpen);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const setScreenshotMode = useUIStore((state) => state.setScreenshotMode);
  const setNotes = useNotesStore((state) => state.setNotes);
  const exportNotes = useNotesStore((state) => state.exportNotes);
  const importNotes = useNotesStore((state) => state.importNotes);
  const rootRef = useUIStore((state) => state.rootRef);
  const { isDevEnv } = useEnv();

  const handleNuke = async () => {
    await chrome.storage.local.clear();
    setNotes([]);
    setActiveView("notes");
  };

  const handleExportNotes = async () => {
    try {
      const notesExport = await exportNotes();
      const blob = new Blob([JSON.stringify(notesExport, null, 2)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `floating-web-notes-${notesExport.exportedAt.replace(
        /[:.]/g,
        "-",
      )}.json`;
      downloadLink.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  };

  const openImportFilePicker = (mode: NotesImportMode) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.hidden = true;
    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0];
        input.remove();
        void handleImportFileChange(file, mode);
      },
      { once: true },
    );
    document.body.append(input);
    input.click();

    window.setTimeout(() => input.remove(), 60_000);
  };

  const handleImportFileChange = async (
    file: File | undefined,
    mode: NotesImportMode,
  ) => {
    if (!file) return;

    try {
      const exportData = JSON.parse(await file.text()) as unknown;

      if (
        mode === "replace" &&
        !window.confirm("Replace all existing notes with this import?")
      ) {
        return;
      }

      const result = await importNotes(exportData, mode);
      window.alert(
        `Imported ${result.imported} notes. Skipped ${result.skipped}.`,
      );
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  };

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger render={<IconButton icon="menu" id="Settings" />} />

      <Menu.Portal container={rootRef}>
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
                  id="theme-option-light"
                  value="light"
                >
                  <Menu.RadioItemIndicator className="DropdownMenuItemIndicator">
                    {icons.check}
                  </Menu.RadioItemIndicator>
                  Light
                </Menu.RadioItem>
                <Menu.RadioItem
                  className="DropdownMenuRadioItem"
                  id="theme-option-dark"
                  value="dark"
                >
                  <Menu.RadioItemIndicator className="DropdownMenuItemIndicator">
                    {icons.check}
                  </Menu.RadioItemIndicator>
                  Dark
                </Menu.RadioItem>
                <Menu.RadioItem
                  className="DropdownMenuRadioItem"
                  id="theme-option-system"
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
                  id="ExportNotesMenuItem"
                  onClick={handleExportNotes}
                >
                  Export notes
                </Menu.Item>
                <Menu.Item
                  className="DropdownMenuItem"
                  id="ImportNotesMenuItem"
                  onClick={() => openImportFilePicker("merge")}
                >
                  Import notes
                </Menu.Item>
                <Menu.Item
                  className="DropdownMenuItem"
                  id="ReplaceNotesMenuItem"
                  onClick={() => openImportFilePicker("replace")}
                >
                  Replace notes from file
                </Menu.Item>
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
