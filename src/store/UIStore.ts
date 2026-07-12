import type { RefObject } from "react";
import { create } from "zustand";
import { Api } from "../api";
import type { Position } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";
import { cleanURL } from "../utils/urls";

let pageStateRequestId = 0;

type UIState = {
  initialized: boolean;
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
  positionContextKey: number;
  hasCustomPosition: boolean;
  setPosition: (position: Position) => Promise<void>;
  restorePosition: (url: string) => Promise<void>;
  synchronizePage: (url: string, active: boolean) => Promise<void>;
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
  initialized: false,
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
  positionContextKey: 0,
  hasCustomPosition: false,
  setPosition: async (position: Position) => {
    const requestId = ++pageStateRequestId;
    const pageKey = cleanURL();
    await Api.set.position(pageKey, position);

    if (
      requestId !== pageStateRequestId ||
      cleanURL(window.location.href) !== pageKey
    ) {
      return;
    }

    set({ position, hasCustomPosition: true });
  },
  restorePosition: async (url: string) => {
    const requestId = ++pageStateRequestId;
    const pageKey = cleanURL(url);
    await Api.remove.position(pageKey);

    if (
      requestId !== pageStateRequestId ||
      cleanURL(window.location.href) !== pageKey
    ) {
      return;
    }

    set({ position: defaultPosition, hasCustomPosition: false });
  },
  synchronizePage: async (url: string, active: boolean) => {
    const requestId = ++pageStateRequestId;
    const pageKey = cleanURL(url);
    set({ active });

    const customPosition = await Api.get.position(pageKey);
    if (
      requestId !== pageStateRequestId ||
      cleanURL(window.location.href) !== pageKey
    ) {
      return;
    }

    set((state) => ({
      initialized: true,
      hasCustomPosition: !!customPosition,
      position: customPosition || defaultPosition,
      positionContextKey: state.positionContextKey + 1,
    }));
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
    const requestId = ++pageStateRequestId;
    const pageKey = cleanURL(window.location.href);
    const [customPosition, dragHandleDiscovered, firstTimeNoticeAck] =
      await Promise.all([
        Api.get.position(pageKey),
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
        getCurrentWebNotes(pageKey),
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

    if (
      requestId !== pageStateRequestId ||
      cleanURL(window.location.href) !== pageKey
    ) {
      set({ firstTimeNoticeAck, dragHandleDiscovered });
      return;
    }

    set((state) => ({
      initialized: true,
      firstTimeNoticeAck,
      dragHandleDiscovered,
      active:
        import.meta.env.MODE === "screenshot"
          ? true
          : (latestActiveOverride ?? isActive),
      hasCustomPosition: !!customPosition,
      position: customPosition || defaultPosition,
      positionContextKey: state.positionContextKey + 1,
    }));
  },
}));
