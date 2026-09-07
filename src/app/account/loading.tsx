import { FormSkeleton, HeaderSkeleton, RowsSkeleton, SkeletonMain } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton />
      <FormSkeleton fields={4} />
      <RowsSkeleton rows={3} />
    </SkeletonMain>
  );
}
