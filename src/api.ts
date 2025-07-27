import type { Command, OpenOptions, ThemeOptions } from "./types";

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
