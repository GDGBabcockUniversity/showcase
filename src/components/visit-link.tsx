"use client";

import { logClick } from "@/app/actions";
import { Button } from "./ui/button";

export function VisitLink({ id, url }: { id: string; url: string }) {
  if (!url) return null;

  return (
    <Button>
      <a
        href={url}
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
