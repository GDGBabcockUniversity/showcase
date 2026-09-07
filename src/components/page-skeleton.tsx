import { Skeleton } from "@/components/ui/skeleton";

// Shared placeholder shapes. Rendered without the nav: loading.tsx has to
// paint instantly, and the nav is async (it reads cookies and the session).
export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mt-6 space-y-px">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-3 py-4 sm:px-5">
          <Skeleton className="h-14 w-14 shrink-0 rounded-lg sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="border-b border-border pb-8">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-5 h-12 w-3/4 max-w-xl" />
      <Skeleton className="mt-4 h-4 w-1/2 max-w-md" />
    </div>
  );
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// Wraps whatever shape a route needs in the same main container the real page
// uses, so nothing jumps when the content swaps in.
export function SkeletonMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-10" aria-busy>
      <span className="sr-only">Loading…</span>
      {children}
    </main>
  );
}
