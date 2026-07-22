import { ENGAGEMENT_WEIGHTS, engagementScore, type Interactions } from "@/lib/gauge";

export function ScoreCard({ interactions }: { interactions: Interactions }) {
  const score = engagementScore(interactions);

  return (
    <div className="relative overflow-hidden border border-border bg-panel p-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue to-transparent" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Community signal
          </p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {score.toFixed(1)}
            <span className="ml-1 text-sm text-muted">signal</span>
          </p>
        </div>
        <div className="flex h-16 items-end gap-1" aria-label="Weighted community interaction">
          {Object.entries(ENGAGEMENT_WEIGHTS).map(([label, weight]) => (
            <span key={label} className="flex-1">
              <span className="block rounded-t-sm bg-blue" style={{ height: `${weight * 56}px`, opacity: 0.45 + weight }} />
              <span className="mt-2 block font-mono text-[8px] uppercase tracking-wider text-muted">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
