import { SkeletonMain } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonMain className="max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg p-2">
            <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-surface-2" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5 bg-surface-2" />
              {i % 2 === 0 && <Skeleton className="h-4 w-3/5 bg-surface-2" />}
              <Skeleton className="h-3 w-20 bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonMain>
  );
}
