import type { Metadata } from "next";
import Link from "next/link";
import {
  LuArrowLeft,
  LuArrowUpRight,
  LuChartNoAxesColumnIncreasing,
  LuCheck,
  LuShieldCheck,
  LuShieldAlert,
} from "react-icons/lu";
import { ReviewSection, StatusBadge } from "../review-ui";
import { ReviewSubmitButton } from "../report-actions";
import { isVideoUrl } from "@/lib/limits";
import { notFound } from "next/navigation";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { abuseFlag, bookmark, interaction, project, user } from "@/db/schema";
import { requireRole } from "@/lib/require-role";
import { hourlyInteractionHistogram } from "@/lib/abuse";
import { getProjectMakers } from "@/lib/projects";
import type { ProjectStatus } from "@/lib/project-status";
import { DemoteForm, StatusButtons } from "./review-actions";
import { reviewAbuseFlag } from "@/app/review/actions";

export const metadata: Metadata = {
  title: "Review project — GDG Babcock Showcase",
};

async function getReviewTarget(id: string) {
  const [row] = await db
    .select({
      id: project.id,
      title: project.title,
      summary: project.summary,
      cover: project.cover,
      media: project.media,
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

export default async function ReviewProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("REVIEWER");
  const { id } = await params;

  const target = await getReviewTarget(id);
  if (!target) notFound();

  const [makers, rawHistogram, flags] = await Promise.all([
    getProjectMakers(id),
    hourlyInteractionHistogram(id),
    db.select().from(abuseFlag).where(eq(abuseFlag.projectId, id)),
  ]);
  const metrics = await Promise.all(
    ["view", "click", "like", "comment"].map(async (type) => {
      const [row] = await db
        .select({ total: count() })
        .from(interaction)
        .where(
          and(
            eq(interaction.projectId, id),
            eq(interaction.type, type),
            ...(type === "comment" ? [isNull(interaction.parentId)] : []),
          ),
        );
      return Number(row?.total ?? 0);
    }),
  );
  const [saved] = await db
    .select({ total: count() })
    .from(bookmark)
    .where(eq(bookmark.projectId, id));

  const histogram = rawHistogram.map((h) => ({
    ...h,
    hour: new Date(h.hour).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }),
  }));
  const role = session.user.role;
  const maxHour = Math.max(1, ...histogram.map((h) => h.count));

  const openFlags = flags.filter((f) => !f.reviewed).length;
  const liveUrl = /^https?:\/\//i.test(target.url) ? target.url : null;

  return (
    <div className="space-y-7">
      <Link
        href="/review"
        className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-muted hover:text-fg"
      >
        <LuArrowLeft size={15} aria-hidden />
        All submissions
      </Link>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="review-caption mb-3">Project review</p>
          <h1 className="break-words text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {target.title}
          </h1>
          <p className="mt-3 text-sm text-muted">
            Submitted by{" "}
            <span className="font-medium text-fg">{target.by}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {target.department ?? "Department not specified"} ·{" "}
            {makers.filter((m) => !m.owner).length} contributor
            {makers.filter((m) => !m.owner).length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={target.status as ProjectStatus} />
          <a href="#decision-heading" className="review-control xl:hidden">
            Review decision
          </a>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section aria-label="Project preview" className="review-panel">
            {target.cover && (
              <div className="aspect-[16/8] overflow-hidden border-b border-border bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={target.cover}
                  alt={`${target.title} cover`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-5 sm:p-6">
              <h2 className="text-base font-semibold tracking-tight">
                About this project
              </h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                {target.summary || "The maker hasn’t added a summary yet."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/project/${target.id}`} className="review-control">
                  View project
                  <LuArrowUpRight size={14} aria-hidden />
                </Link>
                {liveUrl && (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="review-control"
                  >
                    Open live demo
                    <LuArrowUpRight size={14} aria-hidden />
                    <span className="sr-only"> (opens a new tab)</span>
                  </a>
                )}
              </div>
            </div>
            {target.media.length > 0 && (
              <div className="grid grid-cols-2 gap-3 border-t border-border p-5 sm:p-6">
                {target.media.map((url) =>
                  isVideoUrl(url) ? (
                    <video
                      key={url}
                      src={url}
                      controls
                      preload="metadata"
                      aria-label="Project video"
                      className="aspect-video w-full rounded-xl border border-border bg-bg object-contain"
                    />
                  ) : (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overflow-hidden rounded-xl border border-border bg-bg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="Project screenshot (opens in a new tab)"
                        className="aspect-video w-full object-cover"
                      />
                    </a>
                  ),
                )}
              </div>
            )}
          </section>

          <ReviewSection
            title="Project analytics"
            description="A snapshot of the attention this project has earned."
            accessory={
              <LuChartNoAxesColumnIncreasing
                size={18}
                aria-hidden
                className="text-muted"
              />
            }
          >
            <dl className="grid grid-cols-2 border-t border-border sm:grid-cols-5">
              {["Views", "Demo clicks", "Likes", "Comments", "Saves"].map(
                (label, i) => (
                  <div
                    key={label}
                    className={`px-5 py-5 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
                  >
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                      {(i === 4
                        ? Number(saved?.total ?? 0)
                        : metrics[i]
                      ).toLocaleString()}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </ReviewSection>

          <ReviewSection
            title="Activity over time"
            description="Hourly interactions over the last seven days (UTC)."
          >
            <div className="border-t border-border p-5 sm:p-6">
              {histogram.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <LuChartNoAxesColumnIncreasing
                    size={23}
                    aria-hidden
                    className="mx-auto text-muted"
                  />
                  <p className="mt-3 text-sm text-muted">No interactions yet</p>
                  <p className="mt-1 text-xs text-muted">
                    Activity will appear as people discover the project.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="flex h-32 items-end gap-0.5"
                    role="img"
                    aria-label={`Hourly interaction chart. ${histogram.reduce((n, h) => n + h.count, 0)} interactions over ${histogram.length} active hours. Peak: ${maxHour} in one hour.`}
                  >
                    {histogram.map((h) => (
                      <span
                        key={h.hour}
                        title={`${h.hour}: ${h.count} interactions`}
                        className="min-w-0 flex-1 rounded-t-sm bg-blue/70"
                        style={{
                          height: `${Math.max(2, (h.count / maxHour) * 100)}%`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between border-t border-border pt-3 text-[10px] text-muted">
                    <span>{histogram[0].hour}</span>
                    <span className="text-right">
                      {histogram[histogram.length - 1].hour}
                    </span>
                  </div>
                  <details className="mt-4 text-xs text-muted">
                    <summary className="cursor-pointer py-2 font-medium">
                      View activity data
                    </summary>
                    <div className="mt-2 max-h-48 overflow-auto">
                      <table className="w-full text-left">
                        <caption className="sr-only">
                          Hourly interactions
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col" className="py-2 font-medium">
                              Hour
                            </th>
                            <th
                              scope="col"
                              className="py-2 text-right font-medium"
                            >
                              Interactions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {histogram.map((h) => (
                            <tr key={h.hour} className="border-t border-border">
                              <td className="py-2">{h.hour}</td>
                              <td className="py-2 text-right tabular-nums">
                                {h.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </>
              )}
              <p className="mt-4 text-xs leading-relaxed text-muted">
                A spike is a reason to look closer. Shared campus networks can
                produce legitimate bursts of activity.
              </p>
            </div>
          </ReviewSection>

          <ReviewSection
            title="Activity flags"
            description="Review unusual activity before making a decision."
            accessory={<span className="review-status">{openFlags} open</span>}
          >
            {flags.length === 0 ? (
              <div className="border-t border-border p-5 sm:p-6">
                <span className="review-tone-green inline-flex items-center gap-2 text-sm font-medium">
                  <LuShieldCheck size={18} aria-hidden />
                  No activity flags
                </span>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  No IP address has crossed 30 interactions in a single day.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {flags.map((f) => (
                  <li key={f.id} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="break-all font-mono text-xs">
                        {f.ip}
                      </span>
                      <span
                        className={`review-status ${f.abusive ? "review-tone-red" : f.reviewed ? "review-tone-green" : "review-tone-yellow"}`}
                      >
                        <span aria-hidden />
                        {f.abusive
                          ? "Confirmed"
                          : f.reviewed
                            ? "Dismissed"
                            : "Needs review"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {f.day} · {f.count} interactions
                    </p>
                    {!f.reviewed && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <form action={reviewAbuseFlag.bind(null, f.id, true)}>
                          <ReviewSubmitButton danger pendingLabel="Confirming…">
                            Confirm abuse
                          </ReviewSubmitButton>
                        </form>
                        <form action={reviewAbuseFlag.bind(null, f.id, false)}>
                          <ReviewSubmitButton pendingLabel="Dismissing…">
                            Dismiss flag
                          </ReviewSubmitButton>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted sm:px-6">
              Only confirmed flags exclude an IP address’s interactions from
              signal scores.
            </p>
          </ReviewSection>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section
            className="review-panel review-material p-5 sm:p-6"
            aria-labelledby="decision-heading"
          >
            <span className="review-tone-blue mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg">
              <LuCheck size={20} aria-hidden />
            </span>
            <h2
              id="decision-heading"
              className="scroll-mt-28 text-base font-semibold tracking-tight"
            >
              Review decision
            </h2>
            <p className="mb-5 mt-2 text-xs leading-relaxed text-muted">
              Check the project and its activity, then choose what happens next.
            </p>
            <StatusButtons
              projectId={target.id}
              current={target.status as ProjectStatus}
            />
            <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted">
              Publishing makes this project visible on the public board
              immediately.
            </p>
          </section>
          {role === "ADMIN" && (
            <details className="review-panel group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-xs font-medium">
                <span className="inline-flex items-center gap-2">
                  <LuShieldAlert
                    size={16}
                    aria-hidden
                    className="review-tone-red"
                  />
                  Ranking override
                </span>
                <span aria-hidden className="text-muted group-open:hidden">
                  +
                </span>
                <span
                  aria-hidden
                  className="hidden text-muted group-open:inline"
                >
                  −
                </span>
              </summary>
              <div className="border-t border-border p-5">
                <p className="mb-4 text-xs leading-relaxed text-muted">
                  Remove this project from this month’s top three after
                  verifying coordinated activity. Every override is logged.
                </p>
                <DemoteForm projectId={target.id} />
              </div>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
