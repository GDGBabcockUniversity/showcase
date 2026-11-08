import { CardSkeleton, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonMain className="max-w-6xl px-5 py-10 sm:py-14">
      {/* header: cover + title + makers, actions on the right */}
      <header className="mt-8 grid gap-8 border-b border-border pb-8 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <div className="mt-3 flex items-center gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20" />
            <Skeleton className="h-9 w-2/3 sm:h-14" />
          </div>
          <div className="mt-6">
            <Skeleton className="h-2.5 w-20" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-9 w-36 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-12 w-24 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-28 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2.5 w-14" />
          </div>
          <Skeleton className="mt-3 aspect-video w-full rounded-2xl" />

          <section className="mt-12">
            <Skeleton className="h-3 w-28" />
            <div className="mt-4 max-w-2xl space-y-2.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </section>

          <section className="mt-12">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-8 w-44" />
            <RowsSkeleton rows={2} ranked={false} className="mt-4" />
          </section>
        </div>

        <aside className="space-y-6">
          <CardSkeleton className="p-6">
            <Skeleton className="h-3 w-24 bg-surface-2" />
            <Skeleton className="mt-4 h-14 w-36 bg-surface-2" />
            <Skeleton className="mt-4 h-3 w-48 bg-surface-2" />
          </CardSkeleton>
          <CardSkeleton className="p-6">
            <Skeleton className="h-3 w-24 bg-surface-2" />
            <div className="mt-4 divide-y divide-border">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <Skeleton className="h-2.5 w-20 bg-surface-2" />
                  <Skeleton className="h-4 w-24 bg-surface-2" />
                </div>
              ))}
            </div>
          </CardSkeleton>
        </aside>
      </div>
    </SkeletonMain>
  );
}
