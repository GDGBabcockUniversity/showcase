import Link from "next/link";
import { UpvotePill } from "@/components/upvote-pill";
import { UpvoteButton } from "@/components/upvote-button";
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
} & Interactions;

export function ProductRow({
  p,
  rank,
}: {
  p: RowProject;
  rank?: number;
}) {
  const score = engagementScore(p);

  return (
    <Link
      href={`/project/${p.id}`}
      className="group grid grid-cols-[auto_56px_1fr_auto] items-center gap-4 border-b border-border px-3 py-4 transition-colors hover:bg-surface/60 sm:grid-cols-[auto_64px_1fr_auto_auto] sm:gap-5 sm:px-5"
    >
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
          <span className="text-muted">—</span>
          <p className="line-clamp-1 text-sm text-muted">{p.summary}</p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span>by {p.by}</span>
          <span aria-hidden>·</span>
          <span>{p.department}</span>
          <span
            className="rounded-full border border-border px-1.5 py-0.5 tracking-wider text-fg/70"
          >
            {p.type}
          </span>
        </div>
      </div>

      <div className="hidden items-center gap-1 font-mono text-xs text-muted sm:flex" aria-label={`${p.comments} comments`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a8 8 0 0 1-11.7 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"
          />
        </svg>
        <span className="tabular-nums">{p.comments}</span>
      </div>

      <div className="flex items-center gap-2">
        <UpvoteButton id={p.id} initial={p.likes} />
        <UpvotePill signal={score} />
      </div>
    </Link>
  );
}
