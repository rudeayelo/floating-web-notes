import type { Note } from "../types";
import { globToRegExp } from "./globToRegExp";

export const getCurrentWebNotes = async () => {
  const { notesById } = await chrome.storage.local.get("notesById");

  const allNotes = (await chrome.storage.local.get(notesById)) as unknown as {
    [key: string]: Note;
  };

  const currentPageNotes = Object.values(allNotes).filter(({ pattern }) => {
    const rgx = globToRegExp(`*${pattern}`);
    return rgx.test(location.href);
  });

  return currentPageNotes;
};
