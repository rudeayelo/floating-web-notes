import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { createContext, useEffect, useState } from "react";
import type { Note, OpenOptions, ThemeOptions } from "../types";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";
import { useEnv } from "../utils/hooks";

const views = ["notes", "help"] as const;
const defaultDefaultOpen: OpenOptions = "with-notes";
const defaultTheme: ThemeOptions = "light";
const defaultView = "notes";
const defaultHotkey = "Ctrl+N";
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
  const { isDevEnv } = useEnv();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesById, setNotesById] = useState<string[]>([]);
  const [theme, setThemeState] = useState<ThemeOptions>(defaultTheme);
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
      chrome.runtime.sendMessage({ type: "setOpenDefault", value: open });
      setDefaultOpenState(open);
    }
  };

  const setTheme = (theme: string) => {
    if (theme === "light" || theme === "dark" || theme === "system") {
      chrome.runtime.sendMessage({ type: "setTheme", theme });
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are intentionally excluded
  useEffect(() => {
    // Decide if the app should be active or not on first load
    const checkInitialVisibility = async () => {
      const currentNotes = await getCurrentWebNotes();
      const firstTimeNoticeAck = await chrome.runtime.sendMessage({
        type: "getFirstTimeNoticeAck",
      });
      const storageOpen = await chrome.runtime.sendMessage({
        type: "getOpenDefault",
      });
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
      chrome.runtime.sendMessage({ type: "getOpenDefault" }, (open) => {
        if (open) setDefaultOpenState(open);
      });

      // If the user clicks on the extension icon or presses the keyboard
      // shortcut, the active state changes accordingly
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "toggleActive") setActiveState((active) => !active);
      });
    };

    const getTheme = async () => {
      const theme = await chrome.runtime.sendMessage({ type: "getTheme" });
      if (theme) setThemeState(theme);
    };

    const getFirstTimeNoticeAck = async () => {
      const ack = await chrome.runtime.sendMessage({
        type: "getFirstTimeNoticeAck",
      });
      setFirstTimeNoticeAckState(ack);
    };

    const getHotkeys = () => {
      chrome.runtime.sendMessage({ type: "getHotkeys" }, (commands) => {
        for (const { name, shortcut } of commands) {
          console.log({ name, shortcut });
          if (name === "_execute_action") setHotkey(shortcut);
        }
      });
    };

    const checkHotkeyConflict = () => {
      chrome.runtime.sendMessage(
        { type: "checkHotkeyConflict" },
        (hasConflict) => {
          setHotkeyConflict(hasConflict);
        },
      );
    };

    checkInitialVisibility();
    getTheme();
    getFirstTimeNoticeAck();
    getHotkeys();
    checkHotkeyConflict();
  }, []);

  /*
   * This effect sets the list of notes that should be shown on the current page.
   * Whenever the `notesById` state changes, it updates the `notes` state.
   */

  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencies are intentionally excluded for performance
  useEffect(() => {
    (async () => {
      const currentNotes = await getCurrentWebNotes();

      setNotes(currentNotes);
    })();
  }, [active, notesById]);

  /* ------------------------------- DEBUG STATE ------------------------------ */
  // biome-ignore lint/correctness/useExhaustiveDependencies: debug logging with intentionally limited dependencies
  useEffect(() => {
    if (isDevEnv) {
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
