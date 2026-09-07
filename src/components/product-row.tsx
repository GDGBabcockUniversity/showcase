import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LuMessageCircle } from "react-icons/lu";
import { UpvotePill } from "@/components/upvote-pill";
import { UpvoteButton } from "@/components/upvote-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { coverGradient } from "@/lib/cover";
import { engagementScore, type Interactions } from "@/lib/gauge";

type RowProject = {
  id: string;
  title: string;
  summary: string;
  by: string;
  department: string;
  type: string;
  comments: number;
  createdAt: Date;
} & Interactions;

export function ProductRow({
  p,
  rank,
  liked,
  saved,
}: {
  p: RowProject;
  rank?: number;
  liked?: boolean;
  saved?: boolean;
}) {
  const score = engagementScore(p);

  // Mobile stacks: identity on one line, actions underneath — the single row
  // left the title column about 100px wide and broke the meta line onto one
  // word per line. `sm:contents` dissolves the wrapper on wider screens so the
  // same children slot straight into the grid.
  return (
    <Link
      href={`/project/${p.id}`}
      className="group flex flex-col gap-3 border-b border-border px-3 py-4 transition-colors hover:bg-surface/60 sm:grid sm:grid-cols-[auto_64px_1fr_auto_auto] sm:items-center sm:gap-5 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3 sm:contents">
        {typeof rank === "number" ? (
          <span className="w-6 shrink-0 text-center font-mono text-xs text-muted tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
        ) : (
          <span className="w-6" aria-hidden />
        )}

        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white sm:h-16 sm:w-16"
          style={{ background: coverGradient(p.title) }}
        >
          <span className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {p.title[0]}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="font-display text-base font-semibold tracking-tight transition-colors group-hover:text-blue sm:text-lg">
              {p.title}
            </h3>
            <span className="hidden text-muted sm:inline" aria-hidden>—</span>
            <p className="line-clamp-2 w-full text-sm text-muted sm:line-clamp-1 sm:w-auto">
              {p.summary}
            </p>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted sm:gap-x-3 sm:text-[11px]">
            <span className="truncate">by {p.by}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{p.department}</span>
            <span aria-hidden>·</span>
            {/* Rendered on the server; the client's clock can differ by a tick. */}
            <time dateTime={p.createdAt.toISOString()} suppressHydrationWarning>
              {formatDistanceToNow(p.createdAt, { addSuffix: true })}
            </time>
            <span
              className="rounded-full border border-border px-1.5 py-0.5 tracking-wider text-fg/70"
            >
              {p.type}
            </span>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-1 font-mono text-xs text-muted sm:flex" aria-label={`${p.comments} comments`}>
        <LuMessageCircle size={14} aria-hidden />
        <span className="tabular-nums">{p.comments}</span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <BookmarkButton key={`${p.id}-${!!saved}`} id={p.id} saved={!!saved} />
        <UpvoteButton key={`${p.id}-${!!liked}-${p.likes}`} id={p.id} initial={p.likes} liked={!!liked} />
        <UpvotePill signal={score} />
      </div>
    </Link>
  );
}
