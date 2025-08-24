import { globToRegExp } from "./globToRegExp";

export const cleanURL = (url: string = window.location.href) => {
  const u = new URL(url);
  return `${u.origin}${u.pathname}`;
};

export const cleanPattern = (pattern: string) => {
  return pattern.split("#")[0];
};

export const urlMatchesPattern = ({
  url = window.location.href,
  pattern,
}: {
  url?: string;
  pattern: string;
}) => {
  const cleanedURL = cleanURL(url);
  const cleanedPattern = cleanPattern(pattern);

  const rgx = globToRegExp(`*${cleanedPattern}`);
  return rgx.test(cleanedURL);
};

/**
 * Creates an exact pattern from the current URL. It replaces the fragment identifier (#) with a wildcard (*).
 */
export const createExactPatternFromURL: () => string = () => {
  const u = new URL(window.location.href);
  return `${u.host}${u.pathname}`;
};
