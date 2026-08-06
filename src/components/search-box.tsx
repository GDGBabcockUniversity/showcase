"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 3000;

export function SearchBox({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onChange(value: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      const qs = params.toString();
      router.push(qs ? `/feed?${qs}` : "/feed");
    }, DEBOUNCE_MS);
  }

  return (
    <label className="relative flex-1 sm:max-w-xs">
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
        defaultValue={current ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search projects…"
        className="w-full rounded-full border border-border bg-bg py-2 pl-8 pr-4 text-sm text-fg outline-none transition-colors placeholder:text-muted hover:border-blue/50 focus:border-blue"
      />
    </label>
  );
}
