"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductRow } from "@/components/product-row";
import type { Project } from "@/lib/projects";
import { loadMoreArchive } from "./actions";

// Sits under the initial server-rendered page of results and fetches more
// as the sentinel div scrolls into view — a spinner shows while a page is
// in flight, and it stops observing once the cursor runs out.
export function ArchiveInfiniteList({
  initialProjects,
  initialCursor,
  likedIds,
  savedIds,
}: {
  initialProjects: Project[];
  initialCursor: string | null;
  likedIds: string[];
  savedIds: string[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const likedSet = new Set(likedIds);
  const savedSet = new Set(savedIds);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    const page = await loadMoreArchive(cursor);
    setProjects((prev) => [...prev, ...page.projects]);
    setCursor(page.nextCursor);
    setLoading(false);
  }, [cursor, loading]);

  useEffect(() => {
    if (!cursor || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "600px" }, // start fetching well before the user actually hits bottom
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loading, loadMore]);

  return (
    <>
      {projects.map((p, i) => (
        <ProductRow key={p.id} p={p} rank={i + 1} liked={likedSet.has(p.id)} saved={savedSet.has(p.id)} />
      ))}

      {cursor ? (
        <div ref={sentinelRef} className="flex items-center justify-center py-10">
          {loading && (
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-blue"
              role="status"
              aria-label="Loading more projects"
            />
          )}
        </div>
      ) : (
        projects.length > 0 && (
          <p className="py-10 text-center font-mono text-[11px] uppercase tracking-wider text-muted">
            That&apos;s everything.
          </p>
        )
      )}
    </>
  );
}
