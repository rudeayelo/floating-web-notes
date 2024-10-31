import { useContext } from 'react';
import { AppContext } from '../components/AppContext';

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
  const { hotkey, setHotkey, hotkeyConflict } = useContext(AppContext);
  return { hotkey, setHotkey, hotkeyConflict };
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

export const useFirstTimeNoticeAck = () => {
  const { firstTimeNoticeAck, closeFirstTimeNotice } = useContext(AppContext);
  return { firstTimeNoticeAck, closeFirstTimeNotice };
};

export const useEnv = () => {
  const isDevEnv = import.meta.env.DEV;
  const isProdEnv = import.meta.env.PROD;
  console.log('isDevEnv', isDevEnv);
  console.log('isProdEnv', isProdEnv);

  return { isDevEnv, isProdEnv };
};
