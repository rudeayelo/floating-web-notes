import { create } from "zustand";
import { Api } from "../api";
import type { OpenOptions, ThemeOptions } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";

type SettingsState = {
  hotkey: string;
  hotkeyConflict: boolean;
  active: boolean;
  setActive: (active: boolean) => Promise<void>;
  defaultOpen: OpenOptions;
  setDefaultOpen: (open: OpenOptions) => Promise<void>;
  theme: ThemeOptions;
  setTheme: (theme: ThemeOptions) => Promise<void>;
  initialize: () => Promise<void>;
};

// Flag to track if the message listener has been set up
let isListenerSetup = false;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  /* -------------------------------------------------------------------------- */
  /*                                   Hotkey                                   */
  /* -------------------------------------------------------------------------- */
  hotkey: "Ctrl+N",
  hotkeyConflict: false,

  /* -------------------------------------------------------------------------- */
  /*                                Active State                                */
  /* -------------------------------------------------------------------------- */
  active: false,
  setActive: async (active: boolean) => {
    Api.set.visibility(active ? "visible" : "hidden");
    set({ active });
  },

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

    // Initialize active state based on conditions
    const currentNotes = await getCurrentWebNotes();
    const firstTimeNoticeAck = await Api.get.firstTimeNoticeAck();
    const storageOpen = await Api.get.openDefault();
    const initialVisibility = await Api.get.visibility();
    const storageTheme = await Api.get.theme();
    const open = storageOpen || "with-notes";
    const theme = storageTheme || "light";

    let isActive = false;

    if (!firstTimeNoticeAck) {
      isActive = true;
    } else if (
      (open === "never" && initialVisibility !== "visible") ||
      (open === "with-notes" && !currentNotes.length) ||
      initialVisibility === "hidden"
    ) {
      isActive = false;
    } else {
      isActive = true;
    }

    // Setup chrome message listener for toggle (only once)
    if (!isListenerSetup) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "toggleActive") {
          const currentActive = get().active;
          get().setActive(!currentActive);
        }
      });
      isListenerSetup = true;
    }

    set({
      hotkeyConflict: hasConflict,
      active: isActive,
      defaultOpen: open,
      theme,
    });
  },
}));
