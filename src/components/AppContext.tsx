import { type ReactNode, createContext, useState, useEffect } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";
import { type ThemeOptions, type Note, type OpenOptions } from "../types";

const views = ["notes", "help"] as const;
const defaultDefaultOpen: OpenOptions = "with-notes";
const defaultTheme: ThemeOptions = "light";
const defaultView = "notes";
const defaultHotkey = "alt + n";
const defaultActive = false;
const defaultScreenshotMode = false;
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
  setActive: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [active, setActive] = useState(defaultActive);
  const [screenshotMode, setScreenshotMode] = useState(defaultScreenshotMode);
  const [activeView, setActiveView] = useState<
    (typeof views)[number] | undefined
  >();
  const [firstTimeNoticeAck, setFirstTimeNoticeAckState] = useState(
    defaultFirstTimeNoticeAck,
  );
  const [hotkeyConflict, setHotkeyConflict] = useState(defaultHotkeyConflict);

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

  /*
   * This effect runs only when the app is loaded, decides if the app should be
   * active or not based on the `Open by default` user setting.
   */
  useEffect(() => {
    // Decide if the app should be active or not on first load
    (async function () {
      const currentNotes = await getCurrentWebNotes();
      const { firstTimeNoticeAck } =
        await chrome.storage.local.get("firstTimeNoticeAck");
      const { open: storageOpen } = await chrome.storage.local.get("open");
      const open = storageOpen || defaultOpen;

      if (!firstTimeNoticeAck) {
        setActive(true);
      } else if (
        (!active && open === "never") ||
        (!active && open === "with-notes" && !currentNotes.length)
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
        if (msg.type === "toggleActive") setActive((active) => !active);
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * This effect sets the list of notes that should be shown on the current page.
   * Whenever the `notesById` state changes, it updates the `notes` state.
   */
  useEffect(() => {
    (async function () {
      const currentNotes = await getCurrentWebNotes();

      setNotes(currentNotes);
    })();
  }, [active, notesById]);

  useEffect(() => {
    (async function () {
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
    })();
  }, []);

  useEffect(() => {
    chrome.storage.local
      .get("theme")
      .then(({ theme }) => (theme ? setThemeState(theme) : null));
  }, []);

  /* ------------------------------- DEBUG STATE ------------------------------ */
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
