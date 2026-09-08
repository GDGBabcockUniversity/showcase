import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ProductRow } from "@/components/product-row";
import { Confetti, GdgBackdrop } from "@/components/celebration";
import {
  LAST_MONTH_LABEL,
  getBookmarkedProjectIds,
  getLikedProjectIds,
  getTopThreeProjects,
  type Project,
} from "@/lib/projects";
import { auth } from "@/lib/auth";
import { engagementScore } from "@/lib/gauge";

export const metadata: Metadata = {
  title: "This month — GDG Babcock Showcase",
  description: "The three projects the campus community pushed to the top this cycle.",
};

// Second, first, third — so the winner stands in the middle from `sm` up. On
// one column that order would bury the winner, so the flex order is flipped
// back to 1-2-3 on mobile.
const PODIUM = [
  { index: 1, place: "2nd", color: "var(--color-red)", height: "order-2 sm:order-none sm:mt-10" },
  { index: 0, place: "1st", color: "var(--color-yellow)", height: "order-1 sm:order-none" },
  { index: 2, place: "3rd", color: "var(--color-green)", height: "order-3 sm:order-none sm:mt-16" },
];

function Winner({
  p,
  place,
  color,
  className,
}: {
  p: Project;
  place: string;
  color: string;
  className: string;
}) {
  const first = place === "1st";

  return (
    <Link
      href={`/project/${p.id}`}
      className={`group relative flex flex-col items-center rounded-2xl border border-border bg-panel/80 p-5 text-center backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-blue/50 sm:p-6 ${className}`}
      style={{ boxShadow: `0 0 0 1px color-mix(in oklab, ${color} 35%, transparent)` }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full font-display text-base font-bold text-white sm:h-14 sm:w-14 sm:text-lg"
        style={{ background: color }}
      >
        {place}
      </span>
      <h2
        className={`mt-4 font-display font-bold tracking-tight transition-colors group-hover:text-blue ${
          first ? "text-xl sm:text-3xl" : "text-lg sm:text-xl"
        }`}
      >
        {p.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{p.summary}</p>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted">
        by {p.by}
      </p>
      <p
        className="mt-3 font-display text-2xl font-semibold tabular-nums sm:text-3xl"
        style={{ color }}
      >
        {engagementScore(p).toFixed(1)}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Signal</p>
    </Link>
  );
}

export default async function ThisMonthPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [topThree, likedIds, savedIds] = await Promise.all([
    getTopThreeProjects(),
    session ? getLikedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
    session ? getBookmarkedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <>
      <Nav />
      <main className="relative isolate mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <GdgBackdrop />
        <Confetti />

        <section className="relative border-b border-border pb-10 text-center">
          <p className="eyebrow flex items-center justify-center gap-3">
            <Dots />
            Recognition
          </p>
          <h1 className="mt-4 font-display text-[2.5rem] font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(100deg, var(--color-blue), var(--color-red) 35%, var(--color-yellow) 65%, var(--color-green))",
              }}
            >
              {LAST_MONTH_LABEL}&apos;s picks
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Three projects earned the highest weighted community interaction
            this cycle. Ranked by signal, permanent on the board.
          </p>
        </section>

        {topThree.length === 0 ? (
          <p className="relative mt-10 rounded-2xl border border-border bg-surface px-5 py-12 text-center text-sm text-muted sm:py-16">
            Nothing has earned a place yet this cycle.
          </p>
        ) : (
          <>
            {/* Podium — the winner sits centre and tallest. */}
            <section className="relative mt-8 flex flex-col gap-4 sm:mt-10 sm:grid sm:grid-cols-3 sm:items-start">
              {PODIUM.filter((s) => topThree[s.index]).map((s) => (
                <Winner
                  key={s.place}
                  p={topThree[s.index]}
                  place={s.place}
                  color={s.color}
                  className={s.height}
                />
              ))}
            </section>

            <section className="relative mt-10 sm:mt-14">
              <h2 className="border-b border-border pb-3 font-display text-xl font-semibold tracking-tight">
                The full ranking
              </h2>
              {topThree.map((project, index) => (
                <ProductRow
                  key={project.id}
                  p={project}
                  rank={index + 1}
                  liked={likedIds.has(project.id)}
                  saved={savedIds.has(project.id)}
                />
              ))}
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
