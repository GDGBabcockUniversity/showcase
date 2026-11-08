import {
  Eyebrow,
  FormSkeleton,
  RowsSkeleton,
  SkeletonMain,
  StatsSkeleton,
} from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonMain className="max-w-7xl px-5 py-8 sm:py-10">
      <section className="border-b border-border pb-8">
        <Eyebrow />
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-56 sm:h-10" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-2.5 w-64" />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <Skeleton className="h-3 w-24" />
        <FormSkeleton fields={6} className="mt-4" />
        <Skeleton className="mt-6 h-10 w-32 rounded-xl" />
      </section>

      <section className="mt-8">
        <Skeleton className="h-3 w-28" />
        <div className="mt-4">
          <StatsSkeleton />
        </div>
      </section>

      {/* Shipped / Liked / Saved tabs, then the list */}
      <div className="mt-10 flex gap-2 border-b border-border pb-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <RowsSkeleton rows={3} ranked={false} />
    </SkeletonMain>
  );
}
