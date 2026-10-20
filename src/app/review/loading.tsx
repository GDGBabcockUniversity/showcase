export default function ReviewLoading() {
  return (
    <div
      role="status"
      aria-label="Loading review workspace"
      className="space-y-7 motion-safe:animate-pulse"
    >
      <span className="sr-only">Loading review workspace…</span>
      <div className="h-3 w-32 rounded bg-surface-2" />
      <div className="h-10 w-60 rounded-xl bg-surface-2" />
      <div className="h-4 w-3/4 rounded bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
      <div className="review-panel p-6">
        <div className="mb-6 h-5 w-32 rounded bg-surface-2" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="my-4 h-16 rounded-xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
