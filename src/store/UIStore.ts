import { create } from "zustand";
import { Api } from "../api";

type UIState = {
  firstTimeNoticeAck: boolean;
  closeFirstTimeNotice: () => Promise<void>;
  active: boolean;
  setActive: (active: boolean) => Promise<void>;
  activeView: "notes" | "help";
  setActiveView: (view: "notes" | "help") => void;
  screenshotMode: boolean;
  setScreenshotMode: (mode: boolean) => void;
  initialize: () => Promise<void>;
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
  /*                               Initialization                               */
  /* -------------------------------------------------------------------------- */
  initialize: async () => {
    set({ firstTimeNoticeAck: await Api.get.firstTimeNoticeAck() });
  },
}));
