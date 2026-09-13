/**
 * Upvote pill. The arrow is the four GDG dots arranged as a triangle:
 * blue at the apex, red/yellow/green as the base. Brightness is tuned
 * to the signal so higher-signal projects visibly glow.
 */
export function UpvotePill({
  signal,
  compact = false,
}: {
  signal: number;
  compact?: boolean;
}) {
  // Signal is a 0–1.0 weighted composite (see src/lib/signal-scores.ts) — no
  // rescaling needed, just a floor so a brand-new project's dot isn't fully dim.
  const glow = Math.max(0.35, Math.min(1, signal));

  return (
    <div
      className={[
        "inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel transition-colors",
        "group-hover:border-blue group-hover:bg-blue/5",
        compact ? "px-2.5 py-1.5 min-w-[46px]" : "px-3 py-2 min-w-[58px]",
      ].join(" ")}
      aria-label={`Signal ${signal.toFixed(2)}`}
    >
      <svg
        width={compact ? 14 : 16}
        height={compact ? 12 : 14}
        viewBox="0 0 16 14"
        aria-hidden
      >
        <circle cx="8" cy="2.5" r="1.7" fill="var(--color-blue)" style={{ opacity: glow }} />
        <circle cx="3" cy="10.5" r="1.7" fill="var(--color-red)" style={{ opacity: 0.4 + glow * 0.4 }} />
        <circle cx="8" cy="10.5" r="1.7" fill="var(--color-yellow)" style={{ opacity: 0.4 + glow * 0.4 }} />
        <circle cx="13" cy="10.5" r="1.7" fill="var(--color-green)" style={{ opacity: 0.4 + glow * 0.4 }} />
      </svg>
      <span
        className={`font-mono tabular-nums font-semibold ${
          compact ? "text-[11px]" : "text-xs"
        }`}
      >
        {signal.toFixed(2)}
      </span>
    </div>
  );
}
