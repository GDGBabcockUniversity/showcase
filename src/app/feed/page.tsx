import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ProductRow } from "@/components/product-row";
import { DepartmentSelect } from "@/components/department-select";
import { SearchBox } from "@/components/search-box";
import {
  getAllProjects,
  getLikedProjectIds,
  getTopThreeProjects,
  LAST_MONTH_LABEL,
  type Project,
} from "@/lib/projects";
import { auth } from "@/lib/auth";
import {
  DEPARTMENTS,
  PROJECT_TYPES,
  TYPE_LABEL,
  type ProjectType,
} from "@/lib/departments";
import { ENGAGEMENT_WEIGHTS, engagementScore } from "@/lib/gauge";

export const metadata: Metadata = {
  title: "Feed — GDG Babcock Showcase",
  description:
    "Every student project on the board, ranked by real community interaction.",
};

type Search = { type?: string; dept?: string; q?: string };
type Department = (typeof DEPARTMENTS)[number];

function isType(v: string | undefined): v is ProjectType {
  return !!v && (PROJECT_TYPES as readonly string[]).includes(v);
}
function isDept(v: string | undefined): v is Department {
  return !!v && (DEPARTMENTS as readonly string[]).includes(v);
}

const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs transition-colors ${
    active
      ? "border-blue bg-blue/10 text-blue"
      : "border-border text-muted hover:border-fg hover:text-fg"
  }`;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const typeFilter = isType(sp.type) ? sp.type : undefined;
  const deptFilter = isDept(sp.dept) ? sp.dept : undefined;
  const query = sp.q?.trim().toLowerCase();

  const session = await auth.api.getSession({ headers: await headers() });
  const [projects, likedIds] = await Promise.all([
    getAllProjects(),
    session ? getLikedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);
  const filtered = projects
    .filter((p) => !typeFilter || p.type === typeFilter)
    .filter((p) => !deptFilter || p.department === deptFilter)
    .filter(
      (p) =>
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.summary.toLowerCase().includes(query),
    );

  const lastTopThree = await getTopThreeProjects()
  const ranked = [...filtered].sort(
    (a, b) => engagementScore(b) - engagementScore(a),
  );

  // Fake launch-day grouping so the feed feels PH-shaped.
  const groups: { label: string; items: Project[] }[] = [
    { label: "Today · July 22", items: ranked.slice(0, 4) },
    { label: "Yesterday · July 21", items: ranked.slice(4, 7) },
    { label: "Earlier this week", items: ranked.slice(7) },
  ].filter((g) => g.items.length > 0);

  const trending = ranked.slice(0, 5);

  const hrefFor = (next: Partial<Search>) => {
    const merged = { type: typeFilter, dept: deptFilter, q: sp.q, ...next };
    const params = new URLSearchParams();
    if (merged.type) params.set("type", merged.type);
    if (merged.dept) params.set("dept", merged.dept);
    if (merged.q) params.set("q", merged.q);
    const qs = params.toString();
    return qs ? `/feed?${qs}` : "/feed";
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <Dots />
              The board
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
              Every project, ranked by signal.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              What Babcock students shipped this month, ordered by the
              weighted interaction of the campus community.
            </p>
          </div>
          <div className="flex items-end gap-6 font-mono text-xs text-muted">
            <div>
              <p className="text-[10px] uppercase tracking-wider">Filed</p>
              <p className="font-display text-3xl font-semibold tabular-nums text-fg">
                {filtered.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider">Departments</p>
              <p className="font-display text-3xl font-semibold tabular-nums text-fg">
                {new Set(filtered.map((p) => p.department)).size}
              </p>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <div className="mt-6 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pr-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              Categories
            </span>
            <Link href={hrefFor({ type: undefined })} className={chipClass(!typeFilter)}>
              All
            </Link>
            {PROJECT_TYPES.map((t) => (
              <Link key={t} href={hrefFor({ type: t })} className={chipClass(typeFilter === t)}>
                {TYPE_LABEL[t]}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SearchBox current={sp.q} />
            <DepartmentSelect current={deptFilter} />
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Grouped feed */}
          <div className="min-w-0">
            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-border bg-surface py-12 text-center text-muted">
                Nothing on the board for that filter.
              </p>
            ) : (
              groups.map((g, gi) => (
                <div key={g.label} className={gi > 0 ? "mt-10" : ""}>
                  <div className="flex items-baseline justify-between border-b border-border pb-3">
                    <p className="eyebrow">{g.label}</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {g.items.length} launch{g.items.length === 1 ? "" : "es"}
                    </span>
                  </div>
                  {g.items.map((p, i) => (
                    <ProductRow key={p.id} p={p} rank={i + 1} liked={likedIds.has(p.id)} />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            <div id="signal-model" className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Trending</p>
                  <h2 className="mt-1 font-display text-lg font-semibold">
                    Top signal right now
                  </h2>
                </div>
                <span className="h-2 w-2 rounded-full bg-green" />
              </div>
              <ol className="mt-4 space-y-3">
                {trending.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={`/project/${p.id}`}
                      className="group flex items-center gap-3"
                    >
                      <span className="w-4 shrink-0 text-center font-mono text-xs text-muted tabular-nums">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:text-blue">
                          {p.title}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-muted">
                          {p.department}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-blue tabular-nums">
                        {engagementScore(p).toFixed(1)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="eyebrow">How ranking works</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Every interaction pays a different rate. Clicks pay most —
                someone opened the link.
              </p>
              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-3">
                {Object.entries(ENGAGEMENT_WEIGHTS).map(([label, weight]) => (
                  <div key={label}>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {label}
                    </p>
                    <p className="mt-1 font-mono text-xs font-semibold">
                      {Math.round(weight * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue/25 bg-blue/5 p-5">
              <p className="eyebrow">Launching next</p>
              <p className="mt-2 font-display text-base font-semibold">
                Ship your project?
              </p>
              <p className="mt-1 text-sm text-muted">Put it on tomorrow's board.</p>
              <Link
                href="/submit"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Submit a project
              </Link>
            </div>
          </aside>
        </div>

        {!typeFilter && !deptFilter && lastTopThree.length > 0 ? (
          <section className="mt-12">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <div>
                <p className="eyebrow">{LAST_MONTH_LABEL}</p>
                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                  Top 3 of the month
                </h2>
              </div>
              <Link href="/this-month" className="text-xs text-blue hover:underline">
                This month's picks →
              </Link>
            </div>
            {lastTopThree.map((p, i) => (
              <ProductRow key={p.id} p={p} rank={i + 1} liked={likedIds.has(p.id)} />
            ))}
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
