import Link from "next/link";
import { Dots } from "@/components/dots";
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

export function FeedRow({ p, rank }: { p: RowProject; rank?: number }) {
  const score = engagementScore(p);

  return (
    <Link
      href={`/project/${p.id}`}
      className="group relative flex h-full overflow-hidden rounded-[1.5rem] border border-border bg-surface p-3 transition duration-300 hover:-translate-y-1 hover:border-blue/50 hover:shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
    >
      <div
        className="relative flex h-36 w-ful   maxitems-end overflow-hidden rounded-[1.1rem] p-4 text-white sm:h-40"
        style={{ background: coverGradient(p.title) }}
      >
        <span className="absolute -right-2 -top-8 font-display text-8xl font-bold tracking-tighter text-white/15">
          {p.title[0]}
        </span>
        <div className="relative flex w-full items-end justify-between gap-3">
          <span className="rounded-full border border-white/20 bg-black/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] backdrop-blur-sm">
            {p.type}
          </span>
          {typeof rank === "number" ? (
            <span className="font-mono text-xs text-white/80">0{rank}</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-muted">
              <Dots />
              <span className="truncate">{p.department}</span>
            </p>
            <h3 className="mt-3 font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-blue">
              {p.title}
            </h3>
          </div>
          <span className="mt-1 text-xl text-muted transition-all group-hover:translate-x-1 group-hover:text-blue" aria-hidden>
            ↗
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {p.summary}
        </p>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-3">
          <p className="text-xs text-muted">
            by <span className="text-fg">{p.by}</span>
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
            <span>{p.comments} comments</span>
            <span className="rounded-full bg-blue/10 px-2 py-1 text-blue">
              {score.toFixed(1)} signal
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
