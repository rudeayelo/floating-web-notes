import type { Command, Note, OpenOptions, ThemeOptions } from "./types";

const sendMessage = <T>(message: {
  type: string;
  [key: string]: unknown;
}): Promise<T> => {
  return chrome.runtime.sendMessage(message);
};

export const Api = {
  get: {
    firstTimeNoticeAck: (): Promise<boolean> => {
      return sendMessage({ type: "getFirstTimeNoticeAck" });
    },
    openDefault: (): Promise<OpenOptions> => {
      return sendMessage({ type: "getOpenDefault" });
    },
    visibility: (): Promise<"visible" | "hidden"> => {
      return sendMessage({ type: "getVisibility" });
    },
    theme: (): Promise<ThemeOptions> => {
      return sendMessage({ type: "getTheme" });
    },
    hotkeys: (): Promise<Command[]> => {
      return sendMessage({ type: "getHotkeys" });
    },
    hotkeyConflict: (): Promise<boolean> => {
      return sendMessage({ type: "checkHotkeyConflict" });
    },
    notesById: (): Promise<string[]> => {
      return sendMessage({ type: "getNotesById" });
    },
    allNotes: (): Promise<Note[]> => {
      return sendMessage({ type: "getAllNotes" });
    },
  },
  set: {
    visibility: (value: "visible" | "hidden") => {
      sendMessage({ type: "setVisibility", value });
    },
    openDefault: (value: OpenOptions) => {
      sendMessage({ type: "setOpenDefault", value });
    },
    theme: (theme: ThemeOptions) => {
      sendMessage({ type: "setTheme", theme });
    },
    firstTimeNoticeAck: (value: boolean) => {
      sendMessage({ type: "setFirstTimeNoticeAck", value });
    },
    notesById: (notesById: string[]) => {
      sendMessage({ type: "setNotesById", notesById });
    },
    note: ({ id, pattern, text }: Note) => {
      sendMessage({ type: "setNote", id, pattern, text });
    },
  },
  remove: {
    note: (id: string) => {
      sendMessage({ type: "removeNote", id });
    },
  },
  do: {
    openExtensionPage: () => {
      sendMessage({ type: "openExtensionPage" });
    },
    reloadExtension: () => {
      sendMessage({ type: "reloadExtension" });
    },
  },
};
