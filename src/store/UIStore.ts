import type { RefObject } from "react";
import { create } from "zustand";
import { Api } from "../api";
import type { Position } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";
import { cleanURL } from "../utils/urls";

// Guard to ensure the runtime message listener is only set once
let uiToggleListenerSetup = false;

type UIState = {
  firstTimeNoticeAck: boolean;
  closeFirstTimeNotice: () => Promise<void>;
  active: boolean;
  setActive: (active: boolean) => Promise<void>;
  activeView: "notes" | "help";
  setActiveView: (view: "notes" | "help") => void;
  screenshotMode: boolean;
  setScreenshotMode: (mode: boolean) => void;
  position: Position;
  hasCustomPosition: boolean;
  setPosition: (position: Position) => void;
  restorePosition: (url: string) => void;
  dragHandleDiscovered: boolean;
  setDragHandleDiscovered: (value: boolean) => Promise<void>;
  markDragHandleDiscovered: () => Promise<void>;
  // Root ref for the container with id "root"
  rootRef: RefObject<HTMLDivElement | null> | null;
  setRootRef: (ref: RefObject<HTMLDivElement | null>) => void;
  initialize: () => Promise<void>;
};

const defaultPosition: Position =
  import.meta.env.MODE === "screenshot"
    ? { x: 150, y: 100 }
    : { x: document.documentElement.clientWidth - 340 - 24, y: 24 };

export const useUIStore = create<UIState>((set) => ({
  /* -------------------------------------------------------------------------- */
  /*                      First time notice acknowledgment                      */
  /* -------------------------------------------------------------------------- */
  firstTimeNoticeAck: true, // Default value
  closeFirstTimeNotice: async () => {
    set({ firstTimeNoticeAck: true });
    await Api.set.firstTimeNoticeAck(true);
  },

  /* -------------------------------------------------------------------------- */
  /*                                Active state                                */
  /* -------------------------------------------------------------------------- */
  active: false,
  setActive: async (active: boolean) => {
    Api.set.visibility(active ? "visible" : "hidden");
    set({ active });
  },

  /* -------------------------------------------------------------------------- */
  /*                               Active View                                  */
  /* -------------------------------------------------------------------------- */
  activeView: "notes",
  setActiveView: (view: "notes" | "help") => set({ activeView: view }),

  /* -------------------------------------------------------------------------- */
  /*                             Screenshot Mode                                */
  /* -------------------------------------------------------------------------- */
  screenshotMode: import.meta.env.MODE === "screenshot",
  setScreenshotMode: (mode: boolean) => set({ screenshotMode: mode }),

  /* -------------------------------------------------------------------------- */
  /*                               Position                                     */
  /* -------------------------------------------------------------------------- */
  position: defaultPosition,
  hasCustomPosition: false,
  setPosition: (position: Position) => {
    Api.set.position(cleanURL(), position);
    set({ position, hasCustomPosition: true });
  },
  restorePosition: (url: string) => {
    Api.remove.position(cleanURL(url));
    set({ position: defaultPosition, hasCustomPosition: false });
  },

  /* -------------------------------------------------------------------------- */
  /*                         Drag handle discovery flag                         */
  /* -------------------------------------------------------------------------- */
  dragHandleDiscovered: false,
  setDragHandleDiscovered: async (value: boolean) => {
    await Api.set.dragHandleDiscovered(value);
    set({ dragHandleDiscovered: value });
  },
  markDragHandleDiscovered: async () => {
    await Api.set.dragHandleDiscovered(true);
    set({ dragHandleDiscovered: true });
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Root ref                                   */
  /* -------------------------------------------------------------------------- */
  rootRef: null,
  setRootRef: (ref: RefObject<HTMLDivElement | null>) => {
    set({ rootRef: ref });
  },

  /* -------------------------------------------------------------------------- */
  /*                               Initialization                               */
  /* -------------------------------------------------------------------------- */
  initialize: async () => {
    const customPosition = await Api.get.position(
      cleanURL(window.location.href),
    );
    const dragHandleDiscovered = await Api.get.dragHandleDiscovered();
    const firstTimeNoticeAck = await Api.get.firstTimeNoticeAck();

    // Compute initial active value based on settings and current notes
    const [openDefault, initialVisibility, currentNotes] = await Promise.all([
      Api.get.openDefault(),
      Api.get.visibility(),
      getCurrentWebNotes(),
    ]);

    let isActive = false;
    const open = openDefault || "with-notes";

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

    set({
      firstTimeNoticeAck,
      dragHandleDiscovered,
      active: import.meta.env.MODE === "screenshot" ? true : isActive,
      hasCustomPosition: !!customPosition,
      position: customPosition || defaultPosition,
    });

    // Setup chrome message listener for toggle (only once)
    if (!uiToggleListenerSetup) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "toggleActive") {
          const state = useUIStore.getState();
          state.setActive(!state.active);
        }
      });
      uiToggleListenerSetup = true;
    }
  },
}));
