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
    note: (id: string): Promise<Note> => {
      return sendMessage({ type: "getNote", id });
    },
    position: (url: string): Promise<Position> => {
      return sendMessage({ type: "getPosition", url });
    },
    dragHandleDiscovered: (): Promise<boolean> => {
      return sendMessage({ type: "getDragHandleDiscovered" });
    },
  },
  set: {
    visibility: (value: "visible" | "hidden") => {
      return sendMessage({ type: "setVisibility", value });
    },
    openDefault: (value: OpenOptions) => {
      return sendMessage({ type: "setOpenDefault", value });
    },
    theme: (theme: ThemeOptions) => {
      return sendMessage({ type: "setTheme", theme });
    },
    firstTimeNoticeAck: (value: boolean) => {
      return sendMessage({ type: "setFirstTimeNoticeAck", value });
    },
    notesById: (notesById: string[]) => {
      return sendMessage({ type: "setNotesById", notesById });
    },
    note: ({ id, pattern, text }: Note) => {
      return sendMessage({ type: "setNote", id, pattern, text });
    },
    position: (url: string, position: Position) => {
      return sendMessage({ type: "setPosition", url, position });
    },
    dragHandleDiscovered: (value: boolean) => {
      return sendMessage({ type: "setDragHandleDiscovered", value });
    },
  },
  remove: {
    note: (id: string) => {
      return sendMessage({ type: "removeNote", id });
    },
    position: (url: string) => {
      return sendMessage({ type: "removePosition", url });
    },
  },
  do: {
    openExtensionPage: () => {
      return sendMessage({ type: "openExtensionPage" });
    },
    reloadExtension: () => {
      return sendMessage({ type: "reloadExtension" });
    },
  },
};
