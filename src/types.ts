export type Command = {
  name: string;
  shortcut: string;
};

export type Note = {
  id: string;
  text: string;
  pattern: string;
};

export type OpenOptions = "always" | "never" | "with-notes";
export type ThemeOptions = "light" | "dark" | "system";

export type Position = {
  x: number;
  y: number;
};

export type UrlState = {
  [key: string]: { position?: Position } | undefined;
};

export type Visibility = { [key: number]: "visible" | "hidden" };
