import type {
  Command,
  Note,
  OpenOptions,
  Position,
  ThemeOptions,
} from "./types";

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
    position: (url: string): Promise<Position> => {
      return sendMessage({ type: "getPosition", url });
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
    position: (url: string, position: Position) => {
      sendMessage({ type: "setPosition", url, position });
    },
  },
  remove: {
    note: (id: string) => {
      sendMessage({ type: "removeNote", id });
    },
    position: (url: string) => {
      sendMessage({ type: "removePosition", url });
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
