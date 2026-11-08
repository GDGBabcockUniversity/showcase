import {
  CardSkeleton,
  HeaderSkeleton,
  RowsSkeleton,
  SectionHeadSkeleton,
  SkeletonMain,
} from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <SectionHeadSkeleton title="w-40" />
          <RowsSkeleton rows={6} />
        </div>
        {/* "By month" card: year disclosure with its months */}
        <aside className="hidden lg:block">
          <CardSkeleton>
            <Skeleton className="h-3 w-20 bg-surface-2" />
            <div className="mt-4 space-y-1">
              <Skeleton className="h-8 w-full bg-surface-2" />
              <div className="ml-2 space-y-1 border-l border-border pl-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-7 w-full bg-surface-2" />
                ))}
              </div>
              <Skeleton className="mt-2 h-8 w-full bg-surface-2" />
            </div>
          </CardSkeleton>
        </aside>
      </div>
    </SkeletonMain>
  );
}
