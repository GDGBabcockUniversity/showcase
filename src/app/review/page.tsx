import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { formatDistanceToNow } from "date-fns";
import { db } from "@/db";
import {
  collaborationRequest,
  collaborationRequestReport,
  project,
  user,
} from "@/db/schema";
import { requireRole } from "@/lib/require-role";
import { type ProjectStatus } from "@/lib/project-status";
import { getTopThreeProjects } from "@/lib/projects";
import { LuArrowUpRight, LuCheck, LuFlag, LuTrophy } from "react-icons/lu";
import { ReviewQueue } from "./review-queue";
import { ReviewSection, StatusBadge } from "./review-ui";
import { DismissReportButton } from "./report-actions";

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
      cover: project.cover,
      department: project.department,
    })
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(
      and(
        eq(project.draft, false),
        inArray(project.status, ["PENDING", "CHANGES_REQUESTED"]),
      ),
    )
    .orderBy(asc(project.createdAt));
}

const reviewer = alias(user, "reviewer");

async function getRecentDecisions() {
  return db
    .select({
      id: project.id,
      title: project.title,
      status: project.status,
      note: project.reviewNote,
      reviewedAt: project.reviewedAt,
      by: user.name,
      reviewer: reviewer.name,
    })
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .leftJoin(reviewer, eq(project.reviewedBy, reviewer.id))
    .where(isNotNull(project.reviewedAt))
    .orderBy(desc(project.reviewedAt))
    .limit(6);
}

export default async function ReviewPage() {
  const session = await requireRole("REVIEWER");
  const [queue, topThree, decisions, reports] = await Promise.all([
    getQueue(),
    getTopThreeProjects(),
    getRecentDecisions(),
    db
      .select({
        requestId: collaborationRequest.id,
        projectId: project.id,
        title: project.title,
        message: collaborationRequest.message,
        reporter: user.name,
        reason: collaborationRequestReport.reason,
      })
      .from(collaborationRequestReport)
      .innerJoin(
        collaborationRequest,
        eq(collaborationRequest.id, collaborationRequestReport.requestId),
      )
      .innerJoin(project, eq(project.id, collaborationRequest.projectId))
      .innerJoin(user, eq(user.id, collaborationRequestReport.reportedBy)),
  ]);

  const pending = queue.filter((p) => p.status === "PENDING").length;
  const changes = queue.filter((p) => p.status === "CHANGES_REQUESTED").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Review queue
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {pending === 0
              ? "Nothing is waiting for a first look."
              : `${pending} project${pending === 1 ? " is" : "s are"} waiting for a first look. Oldest first, so nobody waits longest.`}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-green" aria-hidden />
          {session.user.role === "ADMIN" ? "Admin" : "Reviewer"}
        </span>
      </header>

      <nav
        aria-label="Workspace summary"
        className="review-panel grid grid-cols-3 divide-x divide-border"
      >
        {[
          { label: "Awaiting review", short: "Awaiting", value: pending, tone: "review-tone-yellow", href: "#submissions" },
          { label: "Changes requested", short: "Changes", value: changes, tone: "review-tone-blue", href: "#submissions" },
          { label: "Open reports", short: "Reports", value: reports.length, tone: "review-tone-red", href: "#reports" },
        ].map((stat) => (
          <a key={stat.label} href={stat.href} className="review-row px-4 py-4 sm:px-6 sm:py-5">
            <span className="flex items-center gap-2 text-xs font-medium text-muted">
              <span className={`h-1.5 w-1.5 rounded-full bg-current ${stat.tone}`} aria-hidden />
              <span className="sm:hidden">{stat.short}</span>
              <span className="hidden sm:inline">{stat.label}</span>
            </span>
            <span className="mt-1.5 block text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {stat.value}
            </span>
          </a>
        ))}
      </nav>

      <ReviewSection id="submissions" title="Submissions">
        <ReviewQueue
          projects={queue.map((p) => ({
            ...p,
            status: p.status as ProjectStatus,
            createdAt: p.createdAt.toISOString(),
          }))}
        />
      </ReviewSection>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ReviewSection
          id="decisions"
          title="Recently decided"
          description="The latest decisions, and the notes makers were sent."
        >
          {decisions.length === 0 ? (
            <p className="border-t border-border px-5 py-8 text-sm text-muted sm:px-6">
              Decisions will show up here once a project has been reviewed.
            </p>
          ) : (
            <ol className="divide-y divide-border border-t border-border">
              {decisions.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/review/${d.id}`}
                    className="review-row flex flex-col gap-2 px-5 py-4 sm:px-6"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold tracking-tight">
                          {d.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          by {d.by}
                        </span>
                      </span>
                      <StatusBadge status={d.status as ProjectStatus} />
                    </span>
                    {d.note && (
                      <span className="line-clamp-2 border-l-2 border-border pl-3 text-xs leading-relaxed text-muted">
                        {d.note}
                      </span>
                    )}
                    <span className="text-[11px] text-muted">
                      {d.reviewer ?? "A reviewer"},{" "}
                      {formatDistanceToNow(d.reviewedAt!, { addSuffix: true })}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </ReviewSection>

        <div className="space-y-6">
          <ReviewSection
            id="reports"
            title="Collaboration reports"
            accessory={<LuFlag size={17} aria-hidden className="text-muted" />}
          >
            {reports.length === 0 ? (
              <p className="flex items-center gap-2 border-t border-border px-5 py-6 text-sm text-muted sm:px-6">
                <LuCheck size={16} aria-hidden className="review-tone-green" />
                No open reports.
              </p>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {reports.map((report) => (
                  <li
                    key={`${report.requestId}-${report.reporter}`}
                    className="p-5 sm:p-6"
                  >
                    <Link
                      href={`/review/${report.projectId}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                    >
                      {report.title}
                      <LuArrowUpRight size={14} aria-hidden />
                    </Link>
                    <p className="mt-2 break-words text-xs leading-relaxed text-muted">
                      Reported by {report.reporter}: {report.reason}
                    </p>
                    <blockquote className="my-4 break-words rounded-xl border border-border bg-bg px-4 py-3 text-sm leading-relaxed text-muted">
                      “{report.message}”
                    </blockquote>
                    <DismissReportButton requestId={report.requestId} />
                  </li>
                ))}
              </ul>
            )}
          </ReviewSection>

          <ReviewSection
            id="rankings"
            title="This month’s top three"
            accessory={
              <LuTrophy size={17} aria-hidden className="review-tone-yellow" />
            }
          >
            {topThree.length === 0 ? (
              <p className="border-t border-border px-5 py-6 text-sm text-muted sm:px-6">
                No project has earned signal this month yet.
              </p>
            ) : (
              <ol className="divide-y divide-border border-t border-border">
                {topThree.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={`/review/${p.id}`}
                      className="review-row flex items-center gap-3 px-5 py-4 sm:px-6"
                    >
                      {/* A real ranking, so the position is the information. */}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold tabular-nums text-muted">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {p.title}
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums text-muted">
                          {p.signalScore.toFixed(2)} signal
                        </span>
                      </span>
                      <LuArrowUpRight size={16} aria-hidden className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </ReviewSection>
        </div>
      </div>
    </div>
  );
}
