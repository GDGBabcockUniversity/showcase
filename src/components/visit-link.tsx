"use client";

import { logClick } from "@/app/actions";

// Lets the destination see where the visit came from. Falls back to the raw
// URL if it isn't absolute/parseable.
function withRef(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("ref", "gdg-babcock-showcase");
    return u.toString();
  } catch {
    return url;
  }
}

export function VisitLink({ id, url }: { id: string; url: string }) {
  if (!url) return null;

  return (
    <a
      href={withRef(url)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        logClick(id);
      }}
      className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-blue px-5 font-mono text-[11px] uppercase tracking-wider text-white transition-opacity hover:opacity-90"
    >
      Visit project ↗
    </a>
  );
}
