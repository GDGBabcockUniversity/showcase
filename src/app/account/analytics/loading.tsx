export default function AnalyticsLoading() {
  return (
    <main
      aria-label="Loading project analytics"
      className="mx-auto max-w-6xl px-5 py-10"
    >
      <div className="h-3 w-32 animate-pulse rounded bg-border" />
      <div className="mt-4 h-10 w-72 animate-pulse rounded bg-border" />
      <div className="mt-8 h-72 animate-pulse rounded-2xl border border-border bg-surface" />
    </main>
  );
}
