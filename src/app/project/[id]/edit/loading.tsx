import { Eyebrow, SkeletonMain, WizardSkeleton } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonMain className="max-w-7xl px-5 py-8 sm:py-10">
      <div className="border-b border-border pb-6">
        <Eyebrow />
      </div>
      <Skeleton className="mt-8 h-9 w-72 max-w-full" />
      <div className="mt-8">
        <WizardSkeleton />
      </div>
    </SkeletonMain>
  );
}
