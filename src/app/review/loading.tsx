import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the review queue: header, three-stat strip, submissions panel with
// its filter bar, then the decisions / reports columns.
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="review-panel">{children}</div>;
}

function PanelTitle({ w = "w-32" }: { w?: string }) {
  return (
    <div className="px-5 py-5 sm:px-6">
      <Skeleton className={`h-5 ${w} bg-surface-2`} />
    </div>
  );
}

export default function ReviewLoading() {
  return (
    <div role="status" aria-label="Loading review workspace" className="space-y-6 sm:space-y-8">
      <span className="sr-only">Loading review workspace…</span>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56 sm:h-10" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </header>

      <Panel>
        <div className="grid grid-cols-3 divide-x divide-border">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="px-4 py-4 sm:px-6 sm:py-5">
              <Skeleton className="h-3 w-20 bg-surface-2" />
              <Skeleton className="mt-2 h-8 w-10 bg-surface-2" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelTitle w="w-36" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">
          <Skeleton className="h-11 w-full rounded-xl bg-surface-2" />
          <div className="flex gap-2 sm:gap-3">
            <Skeleton className="h-10 flex-1 rounded-xl bg-surface-2" />
            <Skeleton className="h-10 w-28 rounded-xl bg-surface-2" />
          </div>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <Skeleton className="h-12 w-12 shrink-0 rounded-lg bg-surface-2" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 bg-surface-2" />
                <Skeleton className="h-3 w-1/4 bg-surface-2" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full bg-surface-2" />
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel>
          <PanelTitle w="w-40" />
          <div className="divide-y divide-border border-t border-border">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2 px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40 bg-surface-2" />
                    <Skeleton className="h-3 w-24 bg-surface-2" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full bg-surface-2" />
                </div>
                <Skeleton className="h-3 w-3/4 bg-surface-2" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelTitle w="w-44" />
          <div className="border-t border-border px-5 py-6 sm:px-6">
            <Skeleton className="h-4 w-40 bg-surface-2" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
