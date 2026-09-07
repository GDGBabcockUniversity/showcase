import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { auth } from "@/lib/auth";
import { getOwnedProject } from "@/lib/projects";
import { db } from "@/db";
import { user } from "@/db/schema";
import { EditForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Edit project — GDG Babcock Showcase",
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/?authModal=1&redirect=/project/${id}/edit`);

  // Scoped to the caller, so someone else's project is a 404 rather than a
  // "forbidden" that would confirm the project exists.
  const owned = await getOwnedProject(id, session.user.id);
  if (!owned) notFound();

  const collaborators = owned.collaborators.length
    ? await db
        .select({ id: user.id, name: user.name, department: user.department })
        .from(user)
        .where(inArray(user.id, owned.collaborators))
    : [];

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-10">
        <p className="eyebrow flex items-center gap-3 border-b border-border pb-6">
          <Dots />
          Edit project
        </p>

        <h1 className="mt-8 flex flex-wrap items-center gap-3 font-display text-3xl font-bold tracking-tight">
          {owned.title}
          {owned.draft && (
            <span className="rounded-full border border-yellow/40 bg-yellow/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-yellow">
              Draft
            </span>
          )}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {owned.draft
            ? "This is a draft — nobody else can see it until you publish. Save as often as you like."
            : "Changes go live immediately, images included."}
        </p>

        <div className="mt-8">
          <EditForm
            project={{
              id: owned.id,
              title: owned.title,
              summary: owned.summary,
              type: owned.type,
              url: owned.url,
              cover: owned.cover,
              media: owned.media,
              draft: owned.draft,
              // Past release times aren't a schedule any more — leave the
              // picker empty rather than showing the filing date.
              releaseAt:
                owned.releaseAt > new Date() ? owned.releaseAt.toISOString() : null,
            }}
            collaborators={collaborators}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
