import { HeaderSkeleton, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton />
      <RowsSkeleton rows={6} className="mt-6" />
    </SkeletonMain>
  );
}
