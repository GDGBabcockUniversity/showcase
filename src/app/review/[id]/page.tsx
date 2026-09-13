import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { db } from "@/db";
import { abuseFlag, project, user } from "@/db/schema";
import { requireRole } from "@/lib/require-role";
import { hourlyInteractionHistogram } from "@/lib/abuse";
import { getProjectMakers } from "@/lib/projects";
import type { ProjectStatus } from "@/lib/project-status";
import { DemoteForm, StatusButtons } from "./review-actions";

export const metadata: Metadata = { title: "Review project — GDG Babcock Showcase" };

async function getReviewTarget(id: string) {
  const [row] = await db
    .select({
      id: project.id,
      title: project.title,
      summary: project.summary,
      url: project.url,
      department: project.department,
      status: project.status,
      by: user.name,
    })
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(eq(project.id, id));
  return row;
}

export default async function ReviewProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("reviewer");
  const { id } = await params;

  const target = await getReviewTarget(id);
  if (!target) notFound();

  const [makers, histogram, flags] = await Promise.all([
    getProjectMakers(id),
    hourlyInteractionHistogram(id),
    db.select().from(abuseFlag).where(eq(abuseFlag.projectId, id)),
  ]);

  const role = session.user.role;
  const maxHour = Math.max(1, ...histogram.map((h) => h.count));

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
        <p className="eyebrow flex items-center gap-3 border-b border-border pb-6">
          <Dots />
          Reviewing
        </p>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">{target.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{target.summary}</p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
          by {target.by} · {target.department ?? "Unfiled"} ·{" "}
          {makers.filter((m) => !m.owner).length} contributor
          {makers.filter((m) => !m.owner).length === 1 ? "" : "s"}
        </p>

        <section className="mt-8 border-t border-border pt-8">
          <p className="eyebrow">Decision</p>
          <div className="mt-3">
            <StatusButtons projectId={target.id} current={target.status as ProjectStatus} />
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-8">
          <p className="eyebrow">Interactions, last 7 days</p>
          <p className="mt-2 text-xs text-muted">
            A gradual climb reads as organic interest. A sudden step — a flat
            line then a spike — is what coordinated activity looks like.
          </p>
          {histogram.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No interactions yet.</p>
          ) : (
            <div className="mt-4 flex h-24 items-end gap-0.5">
              {histogram.map((h) => (
                <span
                  key={h.hour}
                  title={`${h.hour}: ${h.count}`}
                  className="flex-1 bg-blue/60"
                  style={{ height: `${(h.count / maxHour) * 100}%` }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 border-t border-border pt-8">
          <p className="eyebrow">Abuse flags</p>
          {flags.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No IP on this project has crossed 30 interactions in a single day.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {flags.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="font-mono text-xs text-muted">{f.ip}</span>
                  <span>{f.day}</span>
                  <span className="tabular-nums">{f.count} that day</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {f.reviewed ? "Reviewed" : "Open"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">
            Shared campus wifi or a NAT can legitimately produce a spike like
            this — a flag is a prompt to look closer, not a verdict.
          </p>
        </section>

        {role === "lead" && (
          <section className="mt-8 border-t border-red/30 pt-8">
            <p className="eyebrow text-red">Technical Lead override</p>
            <p className="mt-2 text-sm text-muted">
              Demotes this project out of this month&apos;s top 3. Use this only
              for coordinated gaming a reviewer has flagged — not for every
              borderline case. Every use is logged.
            </p>
            <div className="mt-3">
              <DemoteForm projectId={target.id} />
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
