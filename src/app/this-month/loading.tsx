import { HeaderSkeleton, RowsSkeleton, SectionHeadSkeleton, SkeletonMain } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Podium: winner centre and tallest, matching the real PODIUM order.
const PODIUM = ["sm:mt-10", "sm:mt-0", "sm:mt-16"];

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton centered size="lg" />
      <section className="mt-8 flex flex-col gap-4 sm:mt-10 sm:grid sm:grid-cols-3 sm:items-start">
        {PODIUM.map((offset, i) => (
          <div
            key={i}
            className={`flex flex-col items-center rounded-2xl border border-border bg-surface p-5 sm:p-6 ${offset}`}
          >
            <Skeleton className="h-12 w-12 rounded-full bg-surface-2 sm:h-14 sm:w-14" />
            <Skeleton className="mt-4 h-6 w-3/5 bg-surface-2" />
            <Skeleton className="mt-3 h-4 w-4/5 bg-surface-2" />
            <Skeleton className="mt-1.5 h-4 w-2/3 bg-surface-2" />
            <Skeleton className="mt-4 h-3 w-24 bg-surface-2" />
          </div>
        ))}
      </section>
      <section className="mt-10 sm:mt-14">
        <SectionHeadSkeleton title="w-44" />
        <RowsSkeleton rows={3} />
      </section>
    </SkeletonMain>
  );
}
