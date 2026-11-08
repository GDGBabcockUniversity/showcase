import { Skeleton } from "@/components/ui/skeleton";

// Mirrors a project review: back link, status + title, preview panel, and the
// sticky decision column on desktop.
export default function Loading() {
  return (
    <div role="status" aria-label="Loading project review" className="space-y-7">
      <span className="sr-only">Loading project review…</span>
      <Skeleton className="h-4 w-28" />
      <header>
        <Skeleton className="mb-3 h-6 w-24 rounded-full" />
        <Skeleton className="h-9 w-2/3 max-w-xl sm:h-10" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full" />
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="review-panel overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none bg-surface-2" />
            <div className="grid grid-cols-2 gap-3 border-t border-border p-5 sm:p-6">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-2.5 w-16 bg-surface-2" />
                  <Skeleton className="h-4 w-28 bg-surface-2" />
                </div>
              ))}
            </div>
          </div>
          <div className="review-panel space-y-3 p-5 sm:p-6">
            <Skeleton className="h-5 w-32 bg-surface-2" />
            <Skeleton className="h-4 w-full bg-surface-2" />
            <Skeleton className="h-4 w-11/12 bg-surface-2" />
            <Skeleton className="h-4 w-2/3 bg-surface-2" />
          </div>
        </div>
        <div className="review-panel space-y-4 p-5">
          <Skeleton className="h-5 w-24 bg-surface-2" />
          <Skeleton className="h-28 w-full rounded-xl bg-surface-2" />
          <Skeleton className="h-10 w-full rounded-xl bg-surface-2" />
          <Skeleton className="h-10 w-full rounded-xl bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
