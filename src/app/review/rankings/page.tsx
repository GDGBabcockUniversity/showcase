import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowUpRight, LuTrophy } from "react-icons/lu";
import { getTopThreeProjects } from "@/lib/projects";
import { PageHeader, ReviewSection } from "../review-ui";
import { requireRole } from "@/lib/require-role";

export const metadata: Metadata = {
  title: "Rankings — GDG Babcock Showcase",
};

export default async function RankingsPage() {
  await requireRole("REVIEWER");
  const topThree = await getTopThreeProjects();

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Rankings"
        description={"The three projects with the most signal this month."}
      />
      <ReviewSection
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
      </ReviewSection>
    </div>
  );
}
