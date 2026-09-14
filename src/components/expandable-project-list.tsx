"use client";

import { useState } from "react";
import { ProductRow } from "@/components/product-row";
import type { Project } from "@/lib/projects";

// Shows the first `initialCount` rows of a section, with a button to reveal
// the rest — client-only state, no extra fetch, since the whole section's
// data is already server-rendered in one shot.
export function ExpandableProjectList({
  projects,
  likedIds,
  savedIds,
  initialCount = 5,
}: {
  projects: Project[];
  likedIds: string[];
  savedIds: string[];
  initialCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const likedSet = new Set(likedIds);
  const savedSet = new Set(savedIds);
  const visible = expanded ? projects : projects.slice(0, initialCount);
  const hidden = projects.length - visible.length;

  return (
    <>
      {visible.map((p, i) => (
        <ProductRow key={p.id} p={p} rank={i + 1} liked={likedSet.has(p.id)} saved={savedSet.has(p.id)} />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 w-full rounded-full border border-border py-2.5 text-center text-sm text-muted transition-colors hover:border-blue/50 hover:text-blue"
        >
          Show all {projects.length}
        </button>
      )}
    </>
  );
}
