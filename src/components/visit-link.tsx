"use client";

import { logClick } from "@/app/actions";

export function VisitLink({ id, url }: { id: string; url: string }) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        logClick(id);
      }}
      className="font-mono text-[11px] uppercase tracking-wider text-blue hover:underline"
    >
      Visit project ↗
    </a>
  );
}
