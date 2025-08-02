import { Api } from "../api";
import { globToRegExp } from "./globToRegExp";

export const getCurrentWebNotes = async () => {
  const allNotes = await Api.get.allNotes();

  const currentPageNotes = allNotes.filter(({ pattern }) => {
    const rgx = globToRegExp(`*${pattern}`);
    return rgx.test(location.href);
  });

  return currentPageNotes;
};
