import { Api } from "../api";
import { urlMatchesPattern } from "./urls";

export const getCurrentWebNotes = async (
  url: string = window.location.href,
) => {
  const allNotes = await Api.get.allNotes();

  const currentPageNotes = allNotes.filter(({ pattern }) =>
    urlMatchesPattern({ url, pattern }),
  );

  return currentPageNotes;
};
