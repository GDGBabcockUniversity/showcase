import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowUpRight, LuCheck, LuFlag } from "react-icons/lu";
import { getOpenReports } from "../data";
import { DismissReportButton } from "../report-actions";
import { PageHeader, ReviewSection } from "../review-ui";
import { requireRole } from "@/lib/require-role";

export const metadata: Metadata = {
  title: "Reports — GDG Babcock Showcase",
};

export default async function ReportsPage() {
  await requireRole("REVIEWER");
  const reports = await getOpenReports();

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Reports"
        description={"Collaboration requests that members flagged for a look."}
      />
      <ReviewSection
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
    </div>
  );
}
