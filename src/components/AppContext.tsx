import {
  type ReactNode,
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import * as Tooltip from "@radix-ui/react-tooltip";
import { getCurrentWebNotes } from "../utils/getCurrentWebNotes";
import { type ThemeOptions, type Note, type OpenOptions } from "../types";

const views = ["notes", "recordHotkey", "help"] as const;
const defaultDefaultOpen = "with-notes";
const defaultTheme = "light";
const defaultView = "notes";
const defaultHotkey = "alt + n";
const defaultActive = false;
const defaultScreenshotMode = false;

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
  setActive: () => void;
  screenshotMode: boolean;
  setScreenshotMode: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppContext = createContext<AppContextType>({
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

  const setHotkey = (newHotkey: string) => {
    chrome.storage.local.set({ hotkey: newHotkey });
    setHotkeyState(newHotkey);
  };

  const setActive = () => {
    setActiveState((active) => {
      chrome.storage.local.set({ active: !active });
      return !active;
    });
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

  useHotkeys(hotkey, setActive);

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
        await chrome.storage.local.set({ active: true });
        setActiveState(true);
      } else if (
        (!active && open === "never") ||
        (!active && open === "with-notes" && !currentNotes.length)
      ) {
        await chrome.storage.local.set({ active: false });
        setActiveState(false);
      } else {
        await chrome.storage.local.set({ active: true });
        setActiveState(true);
      }

      // Keep the memory state in sync with the storage state
      chrome.storage.local
        .get("open")
        .then(({ open }) => (open ? setDefaultOpenState(open) : null));

      // If the user clicks on the extension icon, the active state will change at
      // the service worker level, so we need to keep the memory state in sync
      chrome.storage.local.onChanged.addListener((changes) => {
        if (changes.active) setActiveState(changes.active.newValue);
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

  /*
   * This effect runs only when the app is loaded, decides if the app should be
   * active or not based on the `Open by default` user setting.
   */
  useEffect(() => {
    chrome.storage.local
      .get("hotkey")
      .then(({ hotkey }) => (hotkey ? setHotkeyState(hotkey) : null));

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
      }}
    >
      <Tooltip.Provider delayDuration={0} disableHoverableContent={true}>
        {children}
      </Tooltip.Provider>
    </AppContext.Provider>
  );
};

export const useNotes = () => {
  const { notes, setNotes } = useContext(AppContext);
  return { notes, setNotes };
};

export const useNotesById = () => {
  const { notesById, setNotesById } = useContext(AppContext);
  return { notesById, setNotesById };
};

export const useTheme = () => {
  const { theme, setTheme } = useContext(AppContext);
  return { theme, setTheme };
};

export const useDefaultOpen = () => {
  const { defaultOpen, setDefaultOpen } = useContext(AppContext);
  return { defaultOpen, setDefaultOpen };
};

export const useHotkey = () => {
  const { hotkey, setHotkey } = useContext(AppContext);
  return { hotkey, setHotkey };
};

export const useActiveView = () => {
  const { activeView, setActiveView } = useContext(AppContext);
  return { activeView, setActiveView };
};

export const useActive = () => {
  const { active, setActive } = useContext(AppContext);
  return { active, setActive };
};

export const useScreenshotMode = () => {
  const { screenshotMode, setScreenshotMode } = useContext(AppContext);
  return { screenshotMode, setScreenshotMode };
};

export const useEnv = () => {
  const { screenshotMode } = useContext(AppContext);
  const isDevEnv = import.meta.env.MODE === "development";
  const hideInProduction = !screenshotMode && isDevEnv;

  return { isDevEnv, hideInProduction };
};
