import { create } from "zustand";
import { Api } from "../api";
import type { OpenOptions, ThemeOptions } from "../types";

// UI-related initialization lives in UIStore

type SettingsState = {
  hotkey: string;
  hotkeyConflict: boolean;
  defaultOpen: OpenOptions;
  setDefaultOpen: (open: OpenOptions) => Promise<void>;
  theme: ThemeOptions;
  setTheme: (theme: ThemeOptions) => Promise<void>;
  initialize: () => Promise<void>;
};

// (No UI listeners here; see UIStore)

export const useSettingsStore = create<SettingsState>((set) => ({
  /* -------------------------------------------------------------------------- */
  /*                                   Hotkey                                   */
  /* -------------------------------------------------------------------------- */
  hotkey: "Ctrl+N",
  hotkeyConflict: false,

  /* -------------------------------------------------------------------------- */
  /*                              Default Open                                  */
  /* -------------------------------------------------------------------------- */
  defaultOpen: "with-notes",
  setDefaultOpen: async (open: OpenOptions) => {
    await Api.set.openDefault(open);
    set({ defaultOpen: open });
  },

  /* -------------------------------------------------------------------------- */
  /*                                  Theme                                     */
  /* -------------------------------------------------------------------------- */
  theme: "light",
  setTheme: async (theme: ThemeOptions) => {
    await Api.set.theme(theme);
    set({ theme });
  },

  /* -------------------------------------------------------------------------- */
  /*                               Initialization                               */
  /* -------------------------------------------------------------------------- */
  initialize: async () => {
    const commands = await Api.get.hotkeys();
    for (const { name, shortcut } of commands) {
      if (name === "_execute_action" && shortcut) {
        set({ hotkey: shortcut });
      }
    }
    const hasConflict = await Api.get.hotkeyConflict();
    const storageTheme = await Api.get.theme();
    const storageOpen = await Api.get.openDefault();
    const open = storageOpen || "with-notes";
    const theme = storageTheme || "light";

    // Apply settings values to SettingsStore
    set({
      hotkeyConflict: hasConflict,
      defaultOpen: open,
      theme,
    });

    // UI visibility is handled in UIStore.initialize()
  },
}));
