import type { RefObject } from "react";
import { create } from "zustand";
import { Api } from "../api";
import type { Position } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";
import { cleanURL } from "../utils/urls";

type UIState = {
  firstTimeNoticeAck: boolean;
  closeFirstTimeNotice: () => Promise<void>;
  active: boolean;
  setActive: (active: boolean) => Promise<void>;
  activeView: "notes" | "help";
  setActiveView: (view: "notes" | "help") => void;
  activeUtilityPanel: "search" | "all-notes" | null;
  setActiveUtilityPanel: (panel: "search" | "all-notes" | null) => void;
  toggleUtilityPanel: (panel: "search" | "all-notes") => void;
  screenshotMode: boolean;
  setScreenshotMode: (mode: boolean) => void;
  position: Position;
  hasCustomPosition: boolean;
  setPosition: (position: Position) => Promise<void>;
  restorePosition: (url: string) => Promise<void>;
  dragHandleDiscovered: boolean;
  setDragHandleDiscovered: (value: boolean) => Promise<void>;
  markDragHandleDiscovered: () => Promise<void>;
  // Root ref for the container with id "root"
  rootRef: RefObject<HTMLDivElement | null> | null;
  setRootRef: (ref: RefObject<HTMLDivElement | null>) => void;
  initialize: (getActiveOverride?: () => boolean | undefined) => Promise<void>;
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
    await Api.set.firstTimeNoticeAck(true);
    set({ firstTimeNoticeAck: true });
  },

  /* -------------------------------------------------------------------------- */
  /*                                Active state                                */
  /* -------------------------------------------------------------------------- */
  active: false,
  setActive: async (active: boolean) => {
    await Api.set.visibility(active ? "visible" : "hidden");
    set({ active });
  },

  /* -------------------------------------------------------------------------- */
  /*                               Active View                                  */
  /* -------------------------------------------------------------------------- */
  activeView: "notes",
  setActiveView: (view: "notes" | "help") => set({ activeView: view }),

  /* -------------------------------------------------------------------------- */
  /*                                Search state                                */
  /* -------------------------------------------------------------------------- */
  activeUtilityPanel: null,
  setActiveUtilityPanel: (panel: "search" | "all-notes" | null) =>
    set({ activeUtilityPanel: panel }),
  toggleUtilityPanel: (panel: "search" | "all-notes") =>
    set((state) => ({
      activeUtilityPanel: state.activeUtilityPanel === panel ? null : panel,
    })),

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
  setPosition: async (position: Position) => {
    await Api.set.position(cleanURL(), position);
    set({ position, hasCustomPosition: true });
  },
  restorePosition: async (url: string) => {
    await Api.remove.position(cleanURL(url));
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
  initialize: async (getActiveOverride) => {
    const [customPosition, dragHandleDiscovered, firstTimeNoticeAck] =
      await Promise.all([
        Api.get.position(cleanURL(window.location.href)),
        Api.get.dragHandleDiscovered(),
        Api.get.firstTimeNoticeAck(),
      ]);

    const initialActiveOverride = getActiveOverride?.();
    let isActive = false;
    if (typeof initialActiveOverride === "boolean") {
      isActive = initialActiveOverride;
    } else {
      const [openDefault, initialVisibility, currentNotes] = await Promise.all([
        Api.get.openDefault(),
        Api.get.visibility(),
        getCurrentWebNotes(),
      ]);
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
    }

    const latestActiveOverride = getActiveOverride?.();

    set({
      firstTimeNoticeAck,
      dragHandleDiscovered,
      active:
        import.meta.env.MODE === "screenshot"
          ? true
          : (latestActiveOverride ?? isActive),
      hasCustomPosition: !!customPosition,
      position: customPosition || defaultPosition,
    });
  },
}));
