import Link from "next/link";
import { headers } from "next/headers";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ProductRow } from "@/components/product-row";
import { getAllProjects, getBookmarkedProjectIds,
  getLikedProjectIds, getTopMakers } from "@/lib/projects";
import { auth } from "@/lib/auth";
import { PROJECT_TYPES, TYPE_LABEL } from "@/lib/departments";
import { engagementScore } from "@/lib/gauge";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [projects, likedIds, savedIds, makers] = await Promise.all([
    getAllProjects(),
    session ? getLikedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
    session ? getBookmarkedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
    getTopMakers(),
  ]);
  const ranked = [...projects].sort(
    (a, b) => engagementScore(b) - engagementScore(a),
  );
  const today = ranked.slice(0, 5);
  const thisWeek = ranked.slice(5, 8);


  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <Dots />
              Tuesday · July 22, 2026
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
              What Babcock shipped today.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              A ranked feed of student projects, sorted by real community
              interaction. Upvotes are weighted views, clicks, likes, and
              comments — not a single tap.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              Submit a project
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-fg hover:bg-surface"
            >
              Browse all
            </Link>
          </div>
        </section>

        {/* Category chips */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="pr-1 font-mono text-[10px] uppercase tracking-wider text-muted">
            Categories
          </span>
          <Link
            href="/feed"
            className="rounded-full border border-blue bg-blue/10 px-3 py-1 text-xs text-blue"
          >
            All
          </Link>
          {PROJECT_TYPES.map((t) => (
            <Link
              key={t}
              href={`/feed?type=${t}`}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-fg hover:text-fg"
            >
              {TYPE_LABEL[t]}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Main feed column */}
          <div className="min-w-0">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <div>
                <p className="eyebrow">Today · top 5</p>
                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                  Ranked by community signal
                </h2>
              </div>
              <Link href="/feed" className="text-xs text-blue hover:underline">
                See all →
              </Link>
            </div>
            <div>
              {today.map((p, i) => (
                <ProductRow key={p.id} p={p} rank={i + 1} liked={likedIds.has(p.id)} saved={savedIds.has(p.id)} />
              ))}
            </div>

            <div className="mt-10 flex items-baseline justify-between border-b border-border pb-3">
              <div>
                <p className="eyebrow">This week</p>
                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                  Also worth a look
                </h2>
              </div>
              <Link href="/feed" className="text-xs text-blue hover:underline">
                Full week →
              </Link>
            </div>
            <div>
              {thisWeek.map((p, i) => (
                <ProductRow key={p.id} p={p} rank={i + 6} liked={likedIds.has(p.id)} saved={savedIds.has(p.id)} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Top makers</p>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  this month
                </span>
              </div>
              {makers.length === 0 && (
                <p className="mt-4 text-sm text-muted">
                  Nobody has shipped yet this month.
                </p>
              )}
              <ol className="mt-4 space-y-3">
                {makers.map((maker, i) => (
                  <li key={maker.userId} className="flex items-center gap-3">
                    <span className="w-4 shrink-0 text-center font-mono text-xs text-muted tabular-nums">
                      {i + 1}
                    </span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-blue), var(--color-green))",
                      }}
                      aria-hidden
                    >
                      {maker.name[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {maker.name}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-muted">
                        {maker.projects} project{maker.projects > 1 ? "s" : ""}
                        {maker.department ? ` · ${maker.department}` : ""}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-blue tabular-nums">
                      {maker.signal.toFixed(0)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-blue/25 bg-blue/5 p-5">
              <p className="eyebrow">Launching next</p>
              <p className="mt-2 font-display text-lg font-semibold">
                Put your project on tomorrow&apos;s board.
              </p>
              <p className="mt-2 text-sm text-muted">
                Under five minutes to file: a link, a two-line summary, a
                department.
              </p>
              <Link
                href="/submit"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Submit a project
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="eyebrow">The signal model</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Clicks are weighted highest — someone opened the link. Then
                likes, then comments, then views. Read the full formula.
              </p>
              <Link
                href="/signal-model"
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue hover:underline"
              >
                How ranking works →
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
