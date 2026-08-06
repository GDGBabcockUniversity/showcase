import Link from "next/link";
import { coverGradient } from "@/lib/cover";
import type { Project } from "@/lib/projects";
import { engagementScore } from "@/lib/gauge";

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      href={`/project/${p.id}`}
      className="card signal-corner group rounded-none border border-border bg-surface p-3 transition duration-300 hover:-translate-y-1 hover:border-blue/50 hover:shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
    >
      <div
        className="relative flex h-40 items-end overflow-hidden p-4"
        style={{ background: coverGradient(p.title) }}
      >
        <span className="relative rounded-full border border-white/15 bg-black/35 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">
          {p.department}
        </span>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-blue">
        {p.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{p.summary}</p>
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Community signal
        </span>
        <span className="font-mono text-xs text-blue">
          {engagementScore(p).toFixed(1)}
        </span>
      </div>
    </Link>
  );
}
