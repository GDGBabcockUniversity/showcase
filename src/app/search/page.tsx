import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { LuCircleHelp } from "react-icons/lu";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ProductRow } from "@/components/product-row";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getAllProjects,
  getBookmarkedProjectIds,
  getLikedProjectIds,
  searchPeople,
} from "@/lib/projects";
import { auth } from "@/lib/auth";
import { engagementScore } from "@/lib/gauge";

export const metadata: Metadata = {
  title: "Search — GDG Babcock Showcase",
  description: "Find a project or the person who built it.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const query = sp.q?.trim().toLowerCase() ?? "";

  const session = await auth.api.getSession({ headers: await headers() });
  const [projects, people, likedIds, savedIds] = await Promise.all([
    query ? getAllProjects() : Promise.resolve([]),
    query ? searchPeople(query) : Promise.resolve([]),
    session ? getLikedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
    session ? getBookmarkedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  // One query covers the title, the pitch, the maker and the topics — the
  // same thing a person typing a name into the nav search expects to hit.
  const matches = projects
    .filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.summary.toLowerCase().includes(query) ||
        p.by.toLowerCase().includes(query) ||
        p.tags.some((t) => t.includes(query)),
    )
    .sort((a, b) => engagementScore(b) - engagementScore(a));

  const nothing = people.length === 0 && matches.length === 0;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="border-b border-border pb-8">
          <p className="eyebrow flex items-center gap-3">
            <Dots />
            Search
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
            {query ? <>Results for “{sp.q?.trim()}”</> : "Search the board."}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Projects and the people who built them. Titles, summaries, makers
            and topics all match.
          </p>
        </section>

        {people.length > 0 && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <p className="eyebrow">People</p>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {people.length} match{people.length === 1 ? "" : "es"}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <Link
                  key={person.id}
                  href={`/u/${person.username ?? person.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-fg/30"
                >
                  <Avatar className="size-10 border border-border">
                    {person.image && <AvatarImage src={person.image} alt="" />}
                    <AvatarFallback className="font-display text-sm font-semibold">
                      {person.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium group-hover:text-blue">
                      {person.name}
                    </span>
                    <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted">
                      {person.department ?? "Unfiled"} · {person.projects} project
                      {person.projects === 1 ? "" : "s"}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {matches.length > 0 && (
          <section className="mt-10">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <p className="eyebrow">Projects</p>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {matches.length} match{matches.length === 1 ? "" : "es"}
              </span>
            </div>
            {matches.map((p, i) => (
              <ProductRow
                key={p.id}
                p={p}
                rank={i + 1}
                liked={likedIds.has(p.id)}
                saved={savedIds.has(p.id)}
              />
            ))}
          </section>
        )}

        {nothing && (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-16 text-center">
            <LuCircleHelp size={40} aria-hidden className="text-muted" />
            <p className="mt-4 font-display text-lg font-semibold">
              Nothing to show here
            </p>
            <p className="mt-1 text-sm text-muted">
              {query
                ? "No project or person matched that."
                : "Type something into the search box above."}
            </p>
            <Link
              href="/feed"
              className="mt-6 font-mono text-[11px] uppercase tracking-wider text-blue hover:underline"
            >
              Browse the whole board →
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
