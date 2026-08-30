// Client-safe on purpose: the toggle imports THEME_COOKIE too, so nothing here
// may pull in next/headers. Callers read the cookie themselves and pass the
// value through themeFromCookie.
export const THEME_COOKIE = "theme";
export type Theme = "light" | "dark";

// The theme lives in a cookie rather than localStorage so the server can put
// the class on <html> itself. That removes the inline bootstrap script, and
// with it any chance of painting the wrong theme first.
export function themeFromCookie(value: string | undefined): Theme {
  return value === "light" ? "light" : "dark";
}
