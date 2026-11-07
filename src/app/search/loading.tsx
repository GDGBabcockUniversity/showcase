import { HeaderSkeleton, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonMain width="max-w-6xl">
      <HeaderSkeleton />
      <Skeleton className="mt-5 h-11 w-full max-w-xl rounded-xl" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <RowsSkeleton rows={4} />
    </SkeletonMain>
  );
}
