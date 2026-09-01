"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 3000;

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live-filtering only makes sense where the results are. Elsewhere this sits
  // in the nav, so auto-navigating would drag the reader off their page.
  const onFeed = pathname === "/feed";
  const urlQuery = searchParams.get("q") ?? "";

  const [value, setValue] = useState(urlQuery);

  // The nav outlives client navigations, so the box would otherwise keep a
  // stale query after a back button or a filter chip. Adjust during render
  // rather than in an effect — setState in effects is an error in this repo.
  const [seen, setSeen] = useState(urlQuery);
  if (seen !== urlQuery) {
    setSeen(urlQuery);
    setValue(urlQuery);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function push(next: string, keepFilters: boolean) {
    // Off the feed, start clean: the current page's params (authModal, and so
    // on) have no business being carried onto the board.
    const params = new URLSearchParams(keepFilters ? searchParams.toString() : "");
    if (next) params.set("q", next);
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/feed?${qs}` : "/feed");
  }

  function onChange(next: string) {
    setValue(next);
    if (!onFeed) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(next, true), DEBOUNCE_MS);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        push(value.trim(), onFeed);
      }}
      className="relative flex-1 sm:max-w-xs"
    >
      <label>
        <span className="sr-only">Search projects</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        >
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11.2 11.2 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={onFeed ? "Search projects…" : "Search projects — press Enter"}
          className="w-full rounded-full border border-border bg-bg py-2 pl-8 pr-4 text-sm text-fg outline-none transition-colors placeholder:text-muted hover:border-blue/50 focus:border-blue"
        />
      </label>
    </form>
  );
}
