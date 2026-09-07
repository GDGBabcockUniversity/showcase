import { HeaderSkeleton, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton />
      <RowsSkeleton rows={5} />
    </SkeletonMain>
  );
}
