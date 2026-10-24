"use client";

import { useSyncExternalStore } from "react";
import { LuSearch } from "react-icons/lu";

import { openSearchPalette } from "@/lib/search-palette";

/**
 * The nav's search affordance.
 *
 * A button, not an input: typing happens in the palette, and a second real
 * text field in the nav would mean two places to type the same query and a
 * focus race between them whenever the shortcut was used.
 */
export function SearchTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openSearchPalette}
      // The shortcut is announced here rather than only in the palette, since
      // this is where someone looks for search before they know it exists.
      aria-keyshortcuts="Meta+K Control+K"
      className={`group flex w-full items-center gap-2 rounded-full border border-border bg-surface/70 py-2 pl-3 pr-2 text-sm text-muted outline-none transition-colors hover:border-blue/40 hover:text-fg ${className ?? ""}`}
    >
      <LuSearch size={14} aria-hidden className="shrink-0" />
      <span className="flex-1 truncate text-left">Search the board…</span>
      <ShortcutHint />
    </button>
  );
}

// The platform never changes, so there is nothing to subscribe to — but
// going through useSyncExternalStore makes the server's answer an explicit
// third argument rather than an initial state that an effect then corrects.
const noSubscribe = () => () => {};
const isMacClient = () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
// The web's majority case, and the one that is merely verbose rather than
// wrong if a Mac briefly sees it.
const isMacServer = () => false;

/**
 * The shortcut badge.
 *
 * Which modifier to name can only be known in the browser, so the server
 * renders the Ctrl form and a Mac swaps to ⌘ on hydration. The badge keeps
 * its width either way, so nothing around it shifts.
 */
function ShortcutHint() {
  const mac = useSyncExternalStore(noSubscribe, isMacClient, isMacServer);

  return (
    <kbd className="hidden shrink-0 rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline-block">
      {mac ? "⌘" : "Ctrl"} K
    </kbd>
  );
}
