import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, count, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookmark, interaction } from "@/db/schema";
import { getProjectsByUser } from "@/lib/projects";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/?authModal=1&redirect=/account/analytics");
  const { range } = await searchParams;
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 0;
  const projects = await getProjectsByUser(session.user.id);
  const published = projects.filter(
    (p) => !p.draft && p.status === "PUBLISHED",
  );
  const ids = published.map((p) => p.id);
  const cutoff = new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000);
  const [activityRows, savedRows] = ids.length
    ? await Promise.all([
        db
          .select({
            projectId: interaction.projectId,
            type: interaction.type,
            total: count(),
          })
          .from(interaction)
          .where(
            and(
              inArray(interaction.projectId, ids),
              or(
                inArray(interaction.type, ["view", "click", "like"]),
                and(
                  eq(interaction.type, "comment"),
                  isNull(interaction.parentId),
                ),
              ),
              ...(days ? [gte(interaction.createdAt, cutoff)] : []),
            ),
          )
          .groupBy(interaction.projectId, interaction.type),
        db
          .select({ projectId: bookmark.projectId, total: count() })
          .from(bookmark)
          .where(
            and(
              inArray(bookmark.projectId, ids),
              ...(days ? [gte(bookmark.createdAt, cutoff)] : []),
            ),
          )
          .groupBy(bookmark.projectId),
      ])
    : [[], []];
  const activity = new Map(
    activityRows.map((row) => [
      `${row.projectId}:${row.type}`,
      Number(row.total),
    ]),
  );
  const saves = new Map(
    savedRows.map((row) => [row.projectId, Number(row.total)]),
  );
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="eyebrow">Maker analytics</p>
        <h1 className="mt-3 font-display text-4xl font-bold">
          Your project reach
        </h1>
        <p className="mt-2 text-sm text-muted">
          Views and clicks follow the app&apos;s existing deduplication rules.
        </p>
        <nav
          aria-label="Analytics time range"
          className="mt-4 flex gap-3 text-sm"
        >
          {[
            { value: "all", label: "All time" },
            { value: "90d", label: "90 days" },
            { value: "30d", label: "30 days" },
          ].map((item) => (
            <Link
              key={item.value}
              href={`/account/analytics?range=${item.value}`}
              className={
                (!days && item.value === "all") || range === item.value
                  ? "font-semibold text-blue"
                  : "text-muted hover:text-fg"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface text-xs text-muted">
              <tr>
                {[
                  "Project",
                  "Views",
                  "Demo clicks",
                  "Likes",
                  "Comments",
                  "Saves",
                ].map((x) => (
                  <th key={x} className="p-4 font-medium">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {published.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-4">
                    <Link
                      className="text-blue hover:underline"
                      href={`/project/${p.id}`}
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    {days ? (activity.get(`${p.id}:view`) ?? 0) : p.views}
                  </td>
                  <td className="p-4">
                    {days ? (activity.get(`${p.id}:click`) ?? 0) : p.clicks}
                  </td>
                  <td className="p-4">
                    {days ? (activity.get(`${p.id}:like`) ?? 0) : p.likes}
                  </td>
                  <td className="p-4">
                    {days ? (activity.get(`${p.id}:comment`) ?? 0) : p.comments}
                  </td>
                  <td className="p-4">{saves.get(p.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {published.length === 0 && (
          <p className="mt-6 rounded-xl border border-border p-8 text-center text-sm text-muted">
            Published project analytics will appear here.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
