import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireRole } from "@/lib/require-role";
import { type ProjectStatus } from "@/lib/project-status";
import { getOpenReports, getQueue, getRecentDecisions } from "./data";
import { PageHeader, ReviewSection, StatusBadge } from "./review-ui";

export const metadata: Metadata = {
  title: "Review — GDG Babcock Showcase",
};

export default async function ReviewPage() {
  const session = await requireRole("REVIEWER");
  const [queue, decisions, reports] = await Promise.all([
    getQueue(),
    getRecentDecisions(),
    getOpenReports(),
  ]);

  const pending = queue.filter((p) => p.status === "PENDING").length;
  const changes = queue.filter((p) => p.status === "CHANGES_REQUESTED").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Review overview"
        description="Where the workspace stands right now."
        accessory={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-green" aria-hidden />
            {session.user.role === "ADMIN" ? "Admin" : "Reviewer"}
          </span>
        }
      />

      <nav
        aria-label="Workspace summary"
        className="review-panel grid grid-cols-3 divide-x divide-border"
      >
        {[
          {
            label: "Awaiting review",
            short: "Awaiting",
            value: pending,
            tone: "review-tone-yellow",
            href: "/review/submissions",
          },
          {
            label: "Changes requested",
            short: "Changes",
            value: changes,
            tone: "review-tone-blue",
            href: "/review/submissions",
          },
          {
            label: "Open reports",
            short: "Reports",
            value: reports.length,
            tone: "review-tone-red",
            href: "/review/reports",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="review-row px-4 py-4 sm:px-6 sm:py-5"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full bg-current ${stat.tone}`}
                aria-hidden
              />
              <span className="sm:hidden">{stat.short}</span>
              <span className="hidden sm:inline">{stat.label}</span>
            </span>
            <span className="mt-1.5 block text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {stat.value}
            </span>
          </Link>
        ))}
      </nav>

      <ReviewSection
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
    </div>
  );
}
