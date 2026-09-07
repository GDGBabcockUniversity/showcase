"use client";

import { LuSearch } from "react-icons/lu";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "./ui/input";

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

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function push(next: string, keepFilters: boolean) {
    // Off the feed, start clean: the current page's params (authModal, and so
    // on) have no business being carried onto the board.
    const params = new URLSearchParams(
      keepFilters ? searchParams.toString() : "",
    );
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
        <LuSearch
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            onFeed ? "Search projects…" : "Search projects — press Enter"
          }
          className="w-full outline-none rounded-full border border-border bg-bg py-2 pl-8 pr-4 text-sm text-fg transition-colors placeholder:text-muted focus-visible:ring-0 focus-visible:border-border"
        />
      </label>
    </form>
  );
}
