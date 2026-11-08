import { HeaderSkeleton, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

function SectionLabel() {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-14" />
    </div>
  );
}

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton>
        {/* the search form: query, skill, checkbox, button */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-56 rounded-full" />
          <Skeleton className="h-9 w-40 rounded-full" />
          <Skeleton className="h-9 w-44 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </HeaderSkeleton>
      <section className="mt-8">
        <SectionLabel />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              <Skeleton className="size-10 shrink-0 rounded-full bg-surface-2" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 bg-surface-2" />
                <Skeleton className="h-2.5 w-1/2 bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-10">
        <SectionLabel />
        <RowsSkeleton rows={4} />
      </section>
    </SkeletonMain>
  );
}
