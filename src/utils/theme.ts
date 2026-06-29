import type { ThemeOptions } from "../types";

export type ResolvedTheme = Exclude<ThemeOptions, "system">;

const systemThemeQuery = "(prefers-color-scheme: dark)";

export const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia(systemThemeQuery).matches ? "dark" : "light";

export const getResolvedTheme = (theme: ThemeOptions): ResolvedTheme =>
  theme === "system" ? getSystemTheme() : theme;

export const watchSystemTheme = (onChange: (theme: ResolvedTheme) => void) => {
  const mediaQuery = window.matchMedia(systemThemeQuery);
  const handleChange = () => {
    onChange(mediaQuery.matches ? "dark" : "light");
  };

  handleChange();
  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
};
