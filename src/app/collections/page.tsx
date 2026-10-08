import Link from "next/link";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { project, showcaseCollection } from "@/db/schema";
import { createCollection } from "@/app/community-actions";

export default async function CollectionsPage() {
  const [session, collections] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db
      .select()
      .from(showcaseCollection)
      .where(eq(showcaseCollection.published, true))
      .orderBy(asc(showcaseCollection.title)),
  ]);
  const canCurate =
    !!session && ["REVIEWER", "ADMIN"].includes(session.user.role ?? "");
  const projects = canCurate
    ? await db
        .select({ id: project.id, title: project.title })
        .from(project)
        .where(eq(project.status, "PUBLISHED"))
        .orderBy(asc(project.title))
    : [];
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="eyebrow">Curated showcase</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Collections</h1>
        {collections.length ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {collections.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border p-5">
                <Link
                  href={`/collections/${c.slug}`}
                  className="font-display text-xl font-semibold hover:text-blue"
                >
                  {c.title}
                </Link>
                <p className="mt-2 text-sm text-muted">{c.description}</p>
                <span className="mt-3 inline-block font-mono text-[10px] uppercase text-blue">
                  Curated selection
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-sm text-muted">
            No collections have been published yet.
          </p>
        )}
        {canCurate && (
          <form
            action={createCollection}
            className="mt-12 grid gap-3 rounded-2xl border border-border p-5"
          >
            <h2 className="font-display text-xl font-semibold">
              Create a collection
            </h2>
            <input
              name="title"
              required
              maxLength={100}
              placeholder="Collection title"
              className="rounded-lg border border-border bg-background p-3"
            />
            <input
              name="slug"
              required
              placeholder="public-url-slug"
              className="rounded-lg border border-border bg-background p-3"
            />
            <textarea
              name="description"
              required
              maxLength={500}
              placeholder="Why these projects belong together"
              className="rounded-lg border border-border bg-background p-3"
            />
            <fieldset className="grid max-h-56 gap-2 overflow-auto">
              {projects.map((p, position) => (
                <label key={p.id} className="flex gap-2 text-sm">
                  <input type="checkbox" name="projectId" value={p.id} />
                  {p.title}
                  <input
                    type="number"
                    min={0}
                    step={1}
                    name={`position:${p.id}`}
                    defaultValue={position}
                    aria-label={`Order of ${p.title}`}
                    className="ml-auto w-16 rounded border border-border bg-background px-2"
                  />
                </label>
              ))}
            </fieldset>
            <button className="justify-self-start rounded-full bg-blue px-4 py-2 text-sm text-white">
              Publish collection
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
