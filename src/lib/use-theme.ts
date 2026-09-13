"use client";

import { useSyncExternalStore } from "react";

export const THEME_CHANGE_EVENT = "theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function getSnapshot() {
  return document.documentElement.classList.contains("light");
}

export function useLightTheme(initialLight: boolean) {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialLight);
}
