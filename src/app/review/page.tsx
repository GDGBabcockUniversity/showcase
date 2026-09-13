import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq, inArray } from "drizzle-orm";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { db } from "@/db";
import { project, user } from "@/db/schema";
import { requireRole } from "@/lib/require-role";
import { STATUS_LABEL, type ProjectStatus } from "@/lib/project-status";
import { getTopThreeProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Review — GDG Babcock Showcase",
};

async function getQueue() {
  return db
    .select({
      id: project.id,
      title: project.title,
      status: project.status,
      createdAt: project.createdAt,
      by: user.name,
    })
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(inArray(project.status, ["PENDING", "CHANGES_REQUESTED"]))
    .orderBy(asc(project.createdAt));
}

export default async function ReviewPage() {
  await requireRole("reviewer");
  const [queue, topThree] = await Promise.all([getQueue(), getTopThreeProjects()]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
        <p className="eyebrow flex items-center gap-3 border-b border-border pb-6">
          <Dots />
          Review queue
        </p>

        <section className="mt-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Waiting on a decision
          </h1>
          {queue.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nothing in the queue.</p>
          ) : (
            <ol className="mt-4 divide-y divide-border border-y border-border">
              {queue.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/review/${p.id}`}
                    className="flex items-center justify-between gap-4 py-4 hover:text-blue"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg font-semibold">
                        {p.title}
                      </span>
                      <span className="block font-mono text-[11px] uppercase tracking-wider text-muted">
                        by {p.by}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {STATUS_LABEL[p.status as ProjectStatus]}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            This month&apos;s top 3
          </h2>
          <p className="mt-2 text-sm text-muted">
            A project flagged by reviewers as gamed can be demoted from here —
            open it to see its abuse flags and interaction history first.
          </p>
          <ol className="mt-4 divide-y divide-border border-y border-border">
            {topThree.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/review/${p.id}`}
                  className="flex items-center justify-between gap-4 py-4 hover:text-blue"
                >
                  <span className="min-w-0">
                    <span className="font-mono text-xs text-muted">№ {i + 1}</span>{" "}
                    <span className="font-display text-lg font-semibold">{p.title}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
                    {p.signalScore.toFixed(2)} signal
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
