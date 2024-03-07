export type Note = {
  id: string;
  text: string;
  pattern: string;
};

export type OpenOptions = "always" | "never" | "with-notes";
export type ThemeOptions = "light" | "dark" | "system";
