import type { Metadata } from "next";
import { type ProjectStatus } from "@/lib/project-status";
import { getQueue } from "../data";
import { ReviewQueue } from "../review-queue";
import { PageHeader, ReviewSection } from "../review-ui";
import { requireRole } from "@/lib/require-role";

export const metadata: Metadata = {
  title: "Submissions — GDG Babcock Showcase",
};

export default async function SubmissionsPage() {
  await requireRole("REVIEWER");
  const queue = await getQueue();
  const pending = queue.filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Submissions"
        description={
          pending === 0
            ? "Nothing is waiting for a first look."
            : `${pending} project${pending === 1 ? " is" : "s are"} waiting for a first look. Oldest first, so nobody waits longest.`
        }
      />
      <ReviewSection title="Submissions">
        <ReviewQueue
          projects={queue.map((p) => ({
            ...p,
            status: p.status as ProjectStatus,
            createdAt: p.createdAt.toISOString(),
          }))}
        />
      </ReviewSection>
    </div>
  );
}
