import { HeaderSkeleton, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton />
      <RowsSkeleton rows={3} />
    </SkeletonMain>
  );
}
