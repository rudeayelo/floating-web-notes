import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { useState } from "react";
import { useNotesStore, useSettingsStore, useUIStore } from "../store";
import type { NotesImportMode, OpenOptions, ThemeOptions } from "../types";
import { useEnv } from "../utils/hooks";
import { IconButton } from "./IconButton";
import { icons } from "./icons";

type PendingNotesImport = {
  exportData: unknown;
  fileName: string;
  noteCount: number;
};

type SettingsDropdownProps = {
  onMenuOpenChange?: (open: boolean) => void;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createImportPreview = (
  exportData: unknown,
  fileName: string,
): PendingNotesImport => {
  if (
    !isRecord(exportData) ||
    exportData.app !== "floating-web-notes" ||
    exportData.schemaVersion !== 1 ||
    !Array.isArray(exportData.notes)
  ) {
    throw new Error("This does not look like a Floating Web Notes export.");
  }

  return {
    exportData,
    fileName,
    noteCount: exportData.notes.length,
  };
};

export const SettingsDropdown = ({
  onMenuOpenChange,
}: SettingsDropdownProps) => {
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
  const [pendingImport, setPendingImport] = useState<PendingNotesImport | null>(
    null,
  );

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

  const openImportFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.hidden = true;
    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0];
        input.remove();
        void handleImportFileChange(file);
      },
      { once: true },
    );
    document.body.append(input);
    input.click();

    window.setTimeout(() => input.remove(), 60_000);
  };

  const handleImportFileChange = async (file: File | undefined) => {
    if (!file) return;

    try {
      const exportData = JSON.parse(await file.text()) as unknown;
      setPendingImport(createImportPreview(exportData, file.name));
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  };

  const handleImportDecision = async (mode: NotesImportMode) => {
    if (!pendingImport) return;

    try {
      const result = await importNotes(pendingImport.exportData, mode);
      setPendingImport(null);
      window.alert(
        `Imported ${result.imported} notes and ${result.positionsImported} positions. Skipped ${result.skipped}.`,
      );
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  };

  return (
    <>
      <Menu.Root modal={false} onOpenChange={onMenuOpenChange}>
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
                onClick={openImportFilePicker}
              >
                Import notes
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

      <Dialog.Root
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null);
        }}
      >
        <Dialog.Portal container={rootRef}>
          <Dialog.Backdrop className="DialogBackdrop" />
          <Dialog.Viewport className="DialogViewport">
            <Dialog.Popup className="DialogPopup" id="ImportNotesDialog">
              <Dialog.Title className="DialogTitle">Import notes?</Dialog.Title>
              <Dialog.Description className="DialogDescription">
                {pendingImport
                  ? `${pendingImport.fileName} contains ${pendingImport.noteCount} notes.`
                  : ""}
              </Dialog.Description>

              <div className="DialogActions">
                <button
                  type="button"
                  className="NeutralButton DialogActionButton"
                  id="ImportNotesAddButton"
                  onClick={() => handleImportDecision("merge")}
                >
                  Add to existing notes
                </button>
                <button
                  type="button"
                  className="AlertActionButton DialogActionButton"
                  id="ImportNotesReplaceButton"
                  onClick={() => handleImportDecision("replace")}
                >
                  Replace existing notes
                </button>
                <Dialog.Close
                  className="ButtonLink DialogCancelButton"
                  id="ImportNotesCancelButton"
                >
                  Cancel
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
