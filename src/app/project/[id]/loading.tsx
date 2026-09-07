import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton />
      {/* Cover slide, then the momentum panel and the related list. */}
      <Skeleton className="mt-10 aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2 bg-surface p-5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <RowsSkeleton rows={3} />
    </SkeletonMain>
  );
}
