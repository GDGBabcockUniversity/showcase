import { SkeletonMain } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <SkeletonMain className="max-w-6xl px-5 py-10">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-10 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-4 flex gap-3">
        {[16, 20, 20].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      {/* the project table: header row + body rows */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-6 gap-4 bg-surface p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-16 bg-surface-2" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 border-t border-border p-4">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 5 }, (_, j) => (
              <Skeleton key={j} className="h-4 w-8" />
            ))}
          </div>
        ))}
      </div>
    </SkeletonMain>
  );
}
