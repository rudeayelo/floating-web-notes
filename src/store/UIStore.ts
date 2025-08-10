import { create } from "zustand";
import { Api } from "../api";
import type { Position } from "../types";

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
  setPosition: (url: string, position: Position) => void;
  restorePosition: (url: string) => void;
  initialize: () => Promise<void>;
};

const defaultPosition: Position = {
  x: document.documentElement.clientWidth - 340 - 24,
  y: 24,
};

const cleanURL = (url: string) => {
  const u = new URL(url);
  const hashPart = u.hash ? `#${u.hash.slice(1).split("?")[0]}` : "";
  return `${u.hostname}${u.pathname}${hashPart}`;
};

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
  position: { x: document.documentElement.clientWidth - 340 - 24, y: 24 },
  hasCustomPosition: false,
  setPosition: (url: string, position: Position) => {
    const cleanedUrl = cleanURL(url);
    Api.set.position(cleanedUrl, position);
    set({ position, hasCustomPosition: true });
  },
  restorePosition: (url: string) => {
    Api.remove.position(cleanURL(url));
    set({ position: defaultPosition, hasCustomPosition: false });
  },

  /* -------------------------------------------------------------------------- */
  /*                               Initialization                               */
  /* -------------------------------------------------------------------------- */
  initialize: async () => {
    const customPosition = await Api.get.position(
      cleanURL(window.location.href),
    );

    set({
      firstTimeNoticeAck: await Api.get.firstTimeNoticeAck(),
      position: customPosition || defaultPosition,
      hasCustomPosition: !!customPosition,
    });
  },
}));
