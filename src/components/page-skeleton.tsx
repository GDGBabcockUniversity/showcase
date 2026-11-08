import { Skeleton } from "@/components/ui/skeleton";

// Placeholder shapes that mirror the real components (same grids, paddings and
// radii), so nothing jumps when content swaps in. Rendered without the nav:
// loading.tsx has to paint instantly, and the nav is async (cookies + session).

// Blocks that sit on a bg-surface card need a darker fill to stay visible.
const ON_CARD = "bg-surface-2";

const TITLE_WIDTHS = ["w-40", "w-52", "w-36", "w-48", "w-44", "w-56"];
const SUMMARY_WIDTHS = ["w-64", "w-52", "w-72", "w-56", "w-60", "w-48"];

export function Eyebrow({ centered = false }: { centered?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
      <Skeleton className="h-2 w-10 rounded-full" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// eyebrow + h1 + intro, as on archive / search / this-month.
export function HeaderSkeleton({
  centered = false,
  size = "md",
  lines = 2,
  children,
}: {
  centered?: boolean;
  size?: "md" | "lg";
  lines?: number;
  children?: React.ReactNode;
}) {
  return (
    <section className={`border-b border-border pb-8 ${centered ? "pb-10 text-center" : ""}`}>
      <Eyebrow centered={centered} />
      <Skeleton
        className={`mt-4 ${size === "lg" ? "h-11 sm:h-[4.5rem]" : "h-10 sm:h-12"} w-3/4 max-w-xl ${
          centered ? "mx-auto" : ""
        }`}
      />
      <div className={`mt-4 space-y-2 ${centered ? "mx-auto max-w-2xl" : "max-w-xl"}`}>
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"} ${centered ? "mx-auto" : ""}`} />
        ))}
      </div>
      {children}
    </section>
  );
}

// "Heading ........ 12 launches" strip above a list.
export function SectionHeadSkeleton({ title = "w-48" }: { title?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-3">
      <Skeleton className={`h-6 ${title}`} />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// One ProductRow: rank, cover, title — summary, meta + pills, comments, save + upvote.
export function RowsSkeleton({
  rows = 6,
  ranked = true,
  className = "",
}: {
  rows?: number;
  ranked?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 border-b border-border px-3 py-4 sm:grid sm:grid-cols-[auto_64px_1fr_auto_auto] sm:items-center sm:gap-5 sm:px-5"
        >
          <div className="flex min-w-0 items-center gap-3 sm:contents">
            {ranked ? <Skeleton className="h-3 w-6 shrink-0" /> : <span className="w-6" aria-hidden />}
            <Skeleton className="h-14 w-14 shrink-0 rounded-lg sm:h-16 sm:w-16" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Skeleton className={`h-5 ${TITLE_WIDTHS[i % TITLE_WIDTHS.length]} max-w-full`} />
                <Skeleton className={`hidden h-4 sm:block ${SUMMARY_WIDTHS[i % SUMMARY_WIDTHS.length]}`} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-14 rounded-full" />
                <Skeleton className="hidden h-4 w-12 rounded-full sm:block" />
              </div>
            </div>
          </div>
          <Skeleton className="hidden h-4 w-8 sm:block" />
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-16 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Labelled inputs, two columns on desktop like the real forms.
export function FormSkeleton({
  fields = 5,
  className = "mt-8",
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={`${className} grid gap-5 lg:grid-cols-2`}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// Surface card with a titled body, as used in sidebars.
export function CardSkeleton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 ${className}`}>{children}</div>
  );
}

// Joined stat cells (signal earned / momentum).
export function StatsSkeleton({ cells = 4 }: { cells?: number }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
      {Array.from({ length: cells }, (_, i) => (
        <div key={i} className="bg-surface p-5">
          <Skeleton className={`h-3 w-16 ${ON_CARD}`} />
          <Skeleton className={`mt-3 h-8 w-14 ${ON_CARD}`} />
        </div>
      ))}
    </div>
  );
}

// Step sidebar + form body shared by submit and edit.
export function WizardSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
      <aside>
        <div className="flex items-center gap-3 px-3 pb-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-col">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-11 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      </aside>
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <FormSkeleton fields={6} />
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Wraps whatever shape a route needs in the same <main> the real page uses.
export function SkeletonMain({
  children,
  className = "max-w-6xl px-4 py-8 sm:px-6 sm:py-10",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`mx-auto w-full ${className}`} aria-busy>
      <span className="sr-only">Loading…</span>
      {children}
    </main>
  );
}
