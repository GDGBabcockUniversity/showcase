import { Eyebrow, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonMain className="max-w-5xl px-5 py-8 sm:py-10">
      <Eyebrow />
      <section className="mt-6 flex flex-wrap items-center gap-5 border-b border-border pb-8">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 sm:h-10" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-2.5 w-56" />
          <Skeleton className="mt-3 h-8 w-24 rounded-xl" />
        </div>
      </section>
      <section className="mt-8">
        <div className="border-b border-border pb-3">
          <Skeleton className="h-6 w-24" />
        </div>
        <RowsSkeleton rows={3} ranked={false} />
      </section>
    </SkeletonMain>
  );
}
