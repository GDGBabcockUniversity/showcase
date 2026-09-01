import { headers } from "next/headers";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ProductRow } from "@/components/product-row";
import { LAST_MONTH_LABEL, getBookmarkedProjectIds,
  getLikedProjectIds, getTopThreeProjects } from "@/lib/projects";
import { auth } from "@/lib/auth";

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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="border-b border-border pb-8">
          <p className="eyebrow flex items-center gap-3">
            <Dots />
            Recognition
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {LAST_MONTH_LABEL}&apos;s picks
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Three projects earned the highest weighted community interaction
            this cycle. Ranked by signal, permanent on the board.
          </p>
        </section>

        <div className="mt-6">
          {topThree.map((project, index) => (
            <ProductRow key={project.id} p={project} rank={index + 1} liked={likedIds.has(project.id)} saved={savedIds.has(project.id)} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
