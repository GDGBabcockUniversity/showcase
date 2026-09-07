import { FormSkeleton, HeaderSkeleton, SkeletonMain } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <SkeletonMain>
      <HeaderSkeleton />
      <FormSkeleton />
    </SkeletonMain>
  );
}
