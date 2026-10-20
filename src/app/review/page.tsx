import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
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
import {
  LuArrowUpRight,
  LuCheck,
  LuClock3,
  LuFlag,
  LuInbox,
  LuTrophy,
} from "react-icons/lu";
import { ReviewQueue } from "./review-queue";
import { ReviewSection } from "./review-ui";
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

export default async function ReviewPage() {
  const session = await requireRole("REVIEWER");
  const [queue, topThree, reports] = await Promise.all([
    getQueue(),
    getTopThreeProjects(),
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
    <div className="space-y-7 sm:space-y-9">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="review-caption">Workspace / Overview</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-green" aria-hidden />
            {session.user.role === "ADMIN" ? "Admin access" : "Reviewer access"}
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          Review queue
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          A closer look at what’s next. Review student work, resolve reports,
          and keep the board worth discovering.
        </p>
      </header>

      <div
        className="grid gap-3 sm:grid-cols-3 sm:gap-4"
        aria-label="Workspace summary"
      >
        {[
          {
            label: "Awaiting review",
            value: pending,
            hint: "Ready for a first look",
            icon: LuInbox,
            tone: "review-tone-yellow",
            href: "#submissions",
          },
          {
            label: "Changes requested",
            value: changes,
            hint: "Waiting on their makers",
            icon: LuClock3,
            tone: "review-tone-blue",
            href: "#submissions",
          },
          {
            label: "Open reports",
            value: reports.length,
            hint: "Community feedback to resolve",
            icon: LuFlag,
            tone: "review-tone-red",
            href: "#reports",
          },
        ].map((stat) => (
          <a
            key={stat.label}
            href={stat.href}
            className="review-panel review-row flex items-center gap-4 p-5 sm:block sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <stat.icon size={19} aria-hidden className={stat.tone} />
              <span className="hidden text-muted sm:block">
                <LuArrowUpRight size={15} aria-hidden />
              </span>
            </div>
            <div className="flex-1 sm:mt-5">
              <p className="text-xs font-medium text-muted">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:mt-2">
                {stat.value}
              </p>
              <p className="mt-2 hidden text-xs text-muted sm:block">
                {stat.hint}
              </p>
            </div>
          </a>
        ))}
      </div>

      <ReviewSection
        id="submissions"
        title="Submissions"
        description="Every project starts with a thoughtful review."
        accessory={
          <span className="review-caption pt-1">{queue.length} total</span>
        }
      >
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
          id="reports"
          title="Collaboration reports"
          description="Help keep project conversations constructive."
          accessory={<LuFlag size={17} aria-hidden className="text-muted" />}
        >
          {reports.length === 0 ? (
            <div className="border-t border-border px-6 py-10">
              <span className="review-tone-green inline-flex items-center gap-2 text-sm font-medium">
                <LuCheck size={17} aria-hidden />
                No open reports
              </span>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Community reports will appear here when they need your
                attention.
              </p>
            </div>
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
                    Reported by {report.reporter} · {report.reason}
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
          description="A quick pulse on the public board."
          accessory={
            <LuTrophy size={17} aria-hidden className="review-tone-yellow" />
          }
        >
          {topThree.length === 0 ? (
            <p className="border-t border-border px-6 py-10 text-sm text-muted">
              Rankings will appear once projects earn signal this month.
            </p>
          ) : (
            <ol className="divide-y divide-border border-t border-border">
              {topThree.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/review/${p.id}`}
                    className="review-row flex items-center gap-3 px-5 py-5 sm:px-6"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {p.title}
                      </span>
                      <span className="mt-1 block text-xs tabular-nums text-muted">
                        {p.signalScore.toFixed(2)} signal
                      </span>
                    </span>
                    <LuArrowUpRight
                      size={16}
                      aria-hidden
                      className="text-muted"
                    />
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <p className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted sm:px-6">
            Open a project to review its activity before taking action on a
            ranking.
          </p>
        </ReviewSection>
      </div>
      <p className="pb-3 text-center text-xs text-muted">
        Made by students. Reviewed with care.
      </p>
    </div>
  );
}
