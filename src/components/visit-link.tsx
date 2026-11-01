"use client";

import { logClick } from "@/app/actions";
import { Button } from "./ui/button";

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
    <Button>
      <a
        href={withRef(url)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          logClick(id);
        }}
        className="font-mono text-[11px] uppercase tracking-wider text-white"
      >
        Visit project ↗
      </a>
    </Button>
  );
}
