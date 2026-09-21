import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { LuChevronDown } from "react-icons/lu";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ProductRow } from "@/components/product-row";
import { auth } from "@/lib/auth";
import {
  getArchivedProjectsPage,
  getBookmarkedProjectIds,
  getLikedProjectIds,
  getProjectsByCohortMonth,
  getPublishedCohortMonths,
} from "@/lib/projects";
import { ArchiveInfiniteList } from "./infinite-list";

export const metadata: Metadata = {
  title: "Archive — GDG Babcock Showcase",
  description: "Browse past launches by the month and year they were published.",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isValidMonth(v: string | undefined): v is string {
  const n = Number(v);
  return !!v && Number.isInteger(n) && n >= 1 && n <= 12;
}
function isValidYear(v: string | undefined): v is string {
  const n = Number(v);
  return !!v && Number.isInteger(n) && n >= 2000 && n <= 2100;
}

// "YYYY-MM" cohorts (already newest-first) grouped into a year -> months
// tree, months newest-first within each year, for the sidebar disclosure.
function groupByYear(cohorts: string[]) {
  const byYear = new Map<string, string[]>();
  for (const c of cohorts) {
    const [year, month] = c.split("-");
    byYear.set(year, [...(byYear.get(year) ?? []), month]);
  }
  return [...byYear.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, months]) => ({ year, months: months.sort((a, b) => Number(b) - Number(a)) }));
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; all?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();

  // No month/year in the URL means "this month," not an empty prompt —
  // explicit ?all=1 is the only way to get the unfiltered infinite scroll.
  const explicitSelection = isValidMonth(sp.month) && isValidYear(sp.year);
  const browseAll = !explicitSelection && sp.all === "1";
  const month = explicitSelection ? sp.month! : String(now.getMonth() + 1);
  const year = explicitSelection ? sp.year! : String(now.getFullYear());

  const hasSelection = !browseAll;
  const cohortMonth = hasSelection ? `${year}-${String(month).padStart(2, "0")}` : null;
  const monthLabel = hasSelection ? `${MONTHS[Number(month) - 1]} ${year}` : null;

  const session = await auth.api.getSession({ headers: await headers() });
  const [cohorts, results, browsePage, likedIds, savedIds] = await Promise.all([
    getPublishedCohortMonths(),
    cohortMonth ? getProjectsByCohortMonth(cohortMonth) : Promise.resolve(null),
    browseAll ? getArchivedProjectsPage() : Promise.resolve(null),
    session ? getLikedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
    session ? getBookmarkedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  const ranked = results ? [...results].sort((a, b) => b.signalScore - a.signalScore) : null;
  const yearGroups = groupByYear(cohorts);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="border-b border-border pb-8">
          <p className="eyebrow flex items-center gap-3">
            <Dots />
            Archive
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
            Browse past launches.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Defaults to this month. Jump to another month from the archive
            on the right, or{" "}
            <Link href="/archive?all=1" className="text-blue hover:underline">
              browse everything before this month →
            </Link>
          </p>
        </section>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* Results */}
          <div className="min-w-0">
            {!ranked ? (
              browsePage && browsePage.projects.length > 0 ? (
                <>
                  <div className="flex items-baseline justify-between border-b border-border pb-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      Everything before this month
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      newest first
                    </span>
                  </div>
                  <ArchiveInfiniteList
                    initialProjects={browsePage.projects}
                    initialCursor={browsePage.nextCursor}
                    likedIds={[...likedIds]}
                    savedIds={[...savedIds]}
                  />
                </>
              ) : (
                <p className="rounded-2xl border border-border bg-surface py-16 text-center text-sm text-muted">
                  Nothing in the archive yet — check back once this month closes out.
                </p>
              )
            ) : ranked.length === 0 ? (
              <p className="rounded-2xl border border-border bg-surface py-16 text-center text-sm text-muted">
                Nothing shipped in {monthLabel}.
              </p>
            ) : (
              <>
                <div className="flex items-baseline justify-between border-b border-border pb-3">
                  <h2 className="font-display text-xl font-semibold tracking-tight">{monthLabel}</h2>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {ranked.length} launch{ranked.length === 1 ? "" : "es"}
                  </span>
                </div>
                {ranked.map((p, i) => (
                  <ProductRow key={p.id} p={p} rank={i + 1} liked={likedIds.has(p.id)} saved={savedIds.has(p.id)} />
                ))}
              </>
            )}
          </div>

          {/* Archive nav — year disclosures, months newest-first, active one highlighted */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="eyebrow">By month</p>
              {yearGroups.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Nothing published yet.</p>
              ) : (
                <nav className="mt-4 space-y-1">
                  {yearGroups.map((g, gi) => (
                    <details key={g.year} open={g.year === year || gi === 0} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-1.5 font-mono text-sm font-medium text-fg transition-colors hover:bg-bg [&::-webkit-details-marker]:hidden">
                        {g.year}
                        <LuChevronDown
                          size={14}
                          className="text-muted transition-transform group-open:rotate-180"
                          aria-hidden
                        />
                      </summary>
                      <ul className="ml-2 mt-1 space-y-0.5 border-l border-border pl-3">
                        {g.months.map((m) => {
                          const active = cohortMonth === `${g.year}-${m}`;
                          return (
                            <li key={m}>
                              <Link
                                href={`/archive?month=${Number(m)}&year=${g.year}`}
                                className={`block rounded-md px-2 py-1 text-sm transition-colors ${
                                  active
                                    ? "bg-blue/10 font-medium text-blue"
                                    : "text-muted hover:bg-bg hover:text-fg"
                                }`}
                              >
                                {MONTHS[Number(m) - 1]}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  ))}
                </nav>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
