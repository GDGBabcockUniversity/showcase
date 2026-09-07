"use client";

import { useSyncExternalStore } from "react";

// The toggle flips a class on <html> and fires this; anything that needs to
// follow the theme at runtime subscribes to the same store.
export const THEME_CHANGE_EVENT = "theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function getSnapshot() {
  return document.documentElement.classList.contains("light");
}

// The server already decided the theme from the cookie, so the server snapshot
// has to agree with it or the first paint hydrates wrong.
export function useLightTheme(initialLight: boolean) {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialLight);
}
