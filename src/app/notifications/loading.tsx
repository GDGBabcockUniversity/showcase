import { SkeletonMain } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonMain width="max-w-2xl">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
      <div className="mt-6 space-y-px">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-border py-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonMain>
  );
}
