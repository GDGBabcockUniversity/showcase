"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { LuArrowUpRight, LuInbox, LuSearch, LuX } from "react-icons/lu";
import type { ProjectStatus } from "@/lib/project-status";
import { StatusBadge } from "./review-ui";

type QueueProject = {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
  by: string;
  cover: string | null;
  department: string | null;
};

export function ReviewQueue({ projects }: { projects: QueueProject[] }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("oldest");
  const visible = projects
    .filter(
      (p) =>
        (filter === "all" || p.status === filter) &&
        `${p.title} ${p.by} ${p.department ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "oldest"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  const filters = [
    { id: "all", label: "All submissions", count: projects.length },
    {
      id: "PENDING",
      label: "Awaiting review",
      count: projects.filter((p) => p.status === "PENDING").length,
    },
    {
      id: "CHANGES_REQUESTED",
      label: "Changes requested",
      count: projects.filter((p) => p.status === "CHANGES_REQUESTED").length,
    },
  ];
  return (
    <>
      <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">
        <div
          className="flex overflow-x-auto rounded-xl bg-surface-2 p-1"
          role="group"
          aria-label="Filter submissions"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className="review-segment flex-1"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className="text-[10px] tabular-nums opacity-70">
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <LuSearch
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-3.5 text-muted"
            />
            <input
              aria-label="Search submissions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, makers, departments…"
              className="h-11 w-full rounded-xl border border-border bg-bg pl-10 pr-10 text-sm placeholder:text-muted"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface"
              >
                <LuX size={15} aria-hidden />
              </button>
            )}
          </div>
          <select
            aria-label="Sort submissions"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 rounded-xl border border-border bg-bg px-3 text-xs font-medium text-muted"
          >
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>
      {visible.length > 0 ? (
        <ol className="divide-y divide-border border-t border-border">
          {visible.map((p) => (
            <li key={p.id}>
              <Link
                href={`/review/${p.id}`}
                className="review-row flex items-center gap-3 px-5 py-5 sm:gap-4 sm:px-6"
              >
                <span className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-2 sm:flex">
                  {p.cover ? (
                    <Image
                      src={p.cover}
                      width={48}
                      height={48}
                      unoptimized
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <LuInbox size={20} aria-hidden className="text-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold tracking-tight">
                    {p.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">
                    {p.by}
                    {p.department ? ` · ${p.department}` : ""}
                  </span>
                  <span className="mt-2 block sm:hidden">
                    <StatusBadge status={p.status} />
                  </span>
                </span>
                <span className="hidden sm:block">
                  <StatusBadge status={p.status} />
                </span>
                <time
                  dateTime={p.createdAt}
                  className="hidden w-20 text-right text-xs tabular-nums text-muted xl:block"
                >
                  {new Date(p.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })}
                </time>
                <LuArrowUpRight
                  size={17}
                  aria-hidden
                  className="shrink-0 text-muted"
                />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col items-center border-t border-border px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
            <LuInbox size={23} aria-hidden />
          </span>
          <h3 className="mt-4 text-sm font-semibold">
            {projects.length
              ? "No matching submissions"
              : "You’re all caught up"}
          </h3>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
            {projects.length
              ? "Try another search or switch the status filter."
              : "New projects will appear here when students submit them for review."}
          </p>
          {projects.length > 0 && (
            <button
              type="button"
              className="review-control mt-5"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
      <p
        role="status"
        className="border-t border-border px-5 py-3 text-xs text-muted sm:px-6"
      >
        {visible.length} of {projects.length} submission
        {projects.length === 1 ? "" : "s"} ·{" "}
        {sort === "oldest" ? "Oldest" : "Newest"} first
      </p>
    </>
  );
}
