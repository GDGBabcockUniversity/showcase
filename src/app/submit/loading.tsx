import { Eyebrow, SkeletonMain, WizardSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <SkeletonMain className="max-w-7xl px-5 py-10 sm:py-14">
      <div className="border-b border-border pb-6">
        <Eyebrow />
      </div>
      <div className="mt-8">
        <WizardSkeleton />
      </div>
    </SkeletonMain>
  );
}
