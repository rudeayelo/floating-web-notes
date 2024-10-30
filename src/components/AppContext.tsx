import * as Tooltip from "@radix-ui/react-tooltip";
import { type ReactNode, createContext, useEffect, useState } from "react";
import type { Note, OpenOptions, ThemeOptions } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";

const views = ["notes", "help"] as const;
const defaultDefaultOpen: OpenOptions = "with-notes";
const defaultTheme: ThemeOptions = "light";
const defaultView = "notes";
const defaultHotkey = "alt + n";
const defaultActive = false;
const defaultScreenshotMode = import.meta.env.MODE === "screenshot";
const defaultFirstTimeNoticeAck = true;
const defaultHotkeyConflict = false;

type AppContextType = {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  notesById: string[];
  setNotesById: React.Dispatch<React.SetStateAction<string[]>>;
  theme: ThemeOptions | undefined;
  setTheme: (theme: ThemeOptions) => void;
  defaultOpen: OpenOptions | undefined;
  setDefaultOpen: (open: OpenOptions) => void;
  hotkey: string;
  setHotkey: (hotkey: string) => void;
  activeView: (typeof views)[number] | undefined;
  setActiveView: React.Dispatch<
    React.SetStateAction<(typeof views)[number] | undefined>
  >;
  active: boolean;
  setActive: (state: boolean) => void;
  screenshotMode: boolean;
  setScreenshotMode: React.Dispatch<React.SetStateAction<boolean>>;
  firstTimeNoticeAck: boolean;
  closeFirstTimeNotice: () => void;
  hotkeyConflict: boolean;
};

export const AppContext = createContext<AppContextType>({
  notes: [],
  setNotes: () => {},
  notesById: [],
  setNotesById: () => {},
  theme: defaultTheme,
  setTheme: () => {},
  defaultOpen: defaultDefaultOpen,
  setDefaultOpen: () => {},
  hotkey: "",
  setHotkey: () => {},
  activeView: defaultView,
  setActiveView: () => {},
  active: defaultActive,
  setActive: () => {},
  screenshotMode: defaultScreenshotMode,
  setScreenshotMode: () => {},
  firstTimeNoticeAck: defaultFirstTimeNoticeAck,
  closeFirstTimeNotice: () => {},
  hotkeyConflict: defaultHotkeyConflict,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesById, setNotesById] = useState<string[]>([]);
  const [theme, setThemeState] = useState<ThemeOptions>();
  const [defaultOpen, setDefaultOpenState] =
    useState<OpenOptions>(defaultDefaultOpen);
  const [hotkey, setHotkeyState] = useState(defaultHotkey);
  const [active, setActiveState] = useState(defaultActive);
  const [screenshotMode, setScreenshotMode] = useState(defaultScreenshotMode);
  const [activeView, setActiveView] = useState<
    (typeof views)[number] | undefined
  >();
  const [firstTimeNoticeAck, setFirstTimeNoticeAckState] = useState(
    defaultFirstTimeNoticeAck,
  );
  const [hotkeyConflict, setHotkeyConflict] = useState(defaultHotkeyConflict);

  const setActive = (active: boolean) => {
    chrome.runtime.sendMessage({
      type: "setVisibility",
      value: active ? "visible" : "hidden",
    });
    setActiveState(active);
  };

  const setHotkey = (newHotkey: string) => {
    setHotkeyState(newHotkey);
  };

  const setDefaultOpen = (open: string) => {
    if (open === "never" || open === "always" || open === "with-notes") {
      chrome.storage.local.set({ open });
      setDefaultOpenState(open);
    }
  };

  const setTheme = (theme: string) => {
    if (theme === "light" || theme === "dark" || theme === "system") {
      chrome.storage.local.set({ theme });
      setThemeState(theme);
    }
  };

  const closeFirstTimeNotice = async () => {
    setFirstTimeNoticeAckState(true);
    await chrome.storage.local.set({ firstTimeNoticeAck: true });
  };

  /* -------------------------------------------------------------------------- */
  /*                      Initial run checks and state sync                     */
  /* -------------------------------------------------------------------------- */
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // Decide if the app should be active or not on first load
    const checkInitialVisibility = async () => {
      const currentNotes = await getCurrentWebNotes();
      const { firstTimeNoticeAck } =
        await chrome.storage.local.get("firstTimeNoticeAck");
      const { open: storageOpen } = await chrome.storage.local.get("open");
      const initialVisibility = await chrome.runtime.sendMessage({
        type: "getVisibility",
      });
      const open = storageOpen || defaultOpen;

      if (!firstTimeNoticeAck) {
        setActive(true);
      } else if (
        (open === "never" && initialVisibility !== "visible") ||
        (open === "with-notes" && !currentNotes.length) ||
        initialVisibility === "hidden"
      ) {
        setActive(false);
      } else {
        setActive(true);
      }

      // Keep the memory state in sync with the storage state
      chrome.storage.local
        .get("open")
        .then(({ open }) => (open ? setDefaultOpenState(open) : null));

      // If the user clicks on the extension icon or presses the keyboard
      // shortcut, the active state changes accordingly
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "toggleActive") setActiveState((active) => !active);
      });
    };

    /* Check if the hotkey is in conflict with other extensions and if not, show
     * the welcome message.
     */
    const checkAlerts = async () => {
      const hotkeyConflict = await chrome.runtime.sendMessage({
        type: "checkHotkeyConflict",
      });
      const hotkeys = await chrome.runtime.sendMessage({
        type: "getHotkeys",
      });

      const { firstTimeNoticeAck } =
        await chrome.storage.local.get("firstTimeNoticeAck");

      if (hotkeyConflict) {
        setHotkeyConflict(true);
      } else {
        setHotkey(hotkeys[0].shortcut);
      }
      if (!firstTimeNoticeAck) setFirstTimeNoticeAckState(false);
    };

    // Synchonise the theme option in storage to the respective state
    const checkTheme = async () => {
      const { theme } = await chrome.storage.local.get("theme");
      theme && setThemeState(theme);
    };

    checkInitialVisibility();
    checkAlerts();
    checkTheme();
  }, []);

  /*
   * This effect sets the list of notes that should be shown on the current page.
   * Whenever the `notesById` state changes, it updates the `notes` state.
   */

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    (async () => {
      const currentNotes = await getCurrentWebNotes();

      setNotes(currentNotes);
    })();
  }, [active, notesById]);

  /* ------------------------------- DEBUG STATE ------------------------------ */
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      chrome.storage.local
        .get()
        .then((state) => console.log("Storage state:", state));
      console.log("Local state:", {
        notes,
        notesById,
        theme,
        defaultOpen,
        hotkey,
        active,
        activeView,
        screenshotMode,
        firstTimeNoticeAck,
        hotkeyConflict,
      });
    }
  }, [active, notesById]);
  /* ----------------------------- END DEBUG STATE ---------------------------- */

  return (
    <AppContext.Provider
      value={{
        notes,
        setNotes,
        notesById,
        setNotesById,
        theme: theme || defaultTheme,
        setTheme,
        defaultOpen: defaultOpen || defaultDefaultOpen,
        setDefaultOpen,
        hotkey,
        setHotkey,
        active,
        setActive,
        activeView: activeView || defaultView,
        setActiveView,
        screenshotMode,
        setScreenshotMode,
        firstTimeNoticeAck,
        closeFirstTimeNotice,
        hotkeyConflict,
      }}
    >
      <Tooltip.Provider delayDuration={0} disableHoverableContent={true}>
        {children}
      </Tooltip.Provider>
    </AppContext.Provider>
  );
};
