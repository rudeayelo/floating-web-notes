import { Api } from "../api";
import { urlMatchesPattern } from "./urls";

export const getCurrentWebNotes = async () => {
  const allNotes = await Api.get.allNotes();

  const currentPageNotes = allNotes.filter(({ pattern }) =>
    urlMatchesPattern({ pattern }),
  );

  return currentPageNotes;
};
