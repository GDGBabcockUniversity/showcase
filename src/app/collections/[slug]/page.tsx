import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ProductRow } from "@/components/product-row";
import { db } from "@/db";
import {
  project,
  showcaseCollection,
  showcaseCollectionProject,
} from "@/db/schema";
import {
  getBookmarkedProjectIds,
  getLikedProjectIds,
  getPublishedProjectsByIds,
} from "@/lib/projects";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [collection] = await db
    .select()
    .from(showcaseCollection)
    .where(eq(showcaseCollection.slug, slug));
  if (!collection?.published) notFound();
  const [rows, session] = await Promise.all([
    db
      .select({ id: project.id })
      .from(showcaseCollectionProject)
      .innerJoin(project, eq(project.id, showcaseCollectionProject.projectId))
      .where(eq(showcaseCollectionProject.collectionId, collection.id))
      .orderBy(asc(showcaseCollectionProject.position)),
    auth.api.getSession({ headers: await headers() }),
  ]);
  const ids = rows.map((row) => row.id);
  const items = await getPublishedProjectsByIds(ids);
  const [liked, saved] = await Promise.all([
    session ? getLikedProjectIds(session.user.id) : new Set<string>(),
    session ? getBookmarkedProjectIds(session.user.id) : new Set<string>(),
  ]);
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="eyebrow">Curated selection</p>
        <h1 className="mt-3 font-display text-4xl font-bold">
          {collection.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          {collection.description}
        </p>
        {items.map((p, i) => (
          <ProductRow
            key={p.id}
            p={p}
            rank={i + 1}
            liked={liked.has(p.id)}
            saved={saved.has(p.id)}
          />
        ))}
      </main>
      <Footer />
    </>
  );
}
