import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ProductRow } from "@/components/product-row";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { follow, project, user } from "@/db/schema";
import {
  getAllProjects,
  getBookmarkedProjectIds,
  getLikedProjectIds,
} from "@/lib/projects";
import { setFollowMuted, setFollowing } from "@/app/community-actions";

export default async function FollowingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/?authModal=1&redirect=/following");
  const [follows, projects, likedIds, savedIds] = await Promise.all([
    db
      .select({
        id: follow.id,
        makerId: follow.makerId,
        projectId: follow.projectId,
        muted: follow.muted,
        makerName: user.name,
        makerUsername: user.username,
        projectTitle: project.title,
      })
      .from(follow)
      .leftJoin(user, eq(follow.makerId, user.id))
      .leftJoin(project, eq(follow.projectId, project.id))
      .where(eq(follow.userId, session.user.id))
      .orderBy(desc(follow.createdAt)),
    getAllProjects(),
    getLikedProjectIds(session.user.id),
    getBookmarkedProjectIds(session.user.id),
  ]);
  const active = follows.filter((f) => !f.muted);
  const items = projects
    .filter((p) =>
      active.some((f) => f.projectId === p.id || f.makerId === p.ownerId),
    )
    .sort(
      (a, b) =>
        (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
    );
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="eyebrow">Following</p>
        <h1 className="mt-3 font-display text-4xl font-bold">
          New work from your follows
        </h1>
        <p className="mt-2 text-sm text-muted">
          Published projects from makers and projects you follow.
        </p>
        {items.length ? (
          items.map((p, i) => (
            <ProductRow
              key={p.id}
              p={p}
              rank={i + 1}
              liked={likedIds.has(p.id)}
              saved={savedIds.has(p.id)}
            />
          ))
        ) : (
          <p className="mt-8 rounded-xl border border-border p-8 text-center text-sm text-muted">
            No new projects here yet. Follow a maker or project to fill this
            feed.
          </p>
        )}
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Manage follows</h2>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {follows.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <Link
                  className="text-blue hover:underline"
                  href={
                    f.makerId ? `/u/${f.makerId}` : `/project/${f.projectId}`
                  }
                >
                  {f.makerId
                    ? `@${f.makerUsername ?? f.makerName ?? f.makerId}`
                    : (f.projectTitle ?? "Removed project")}
                </Link>
                <span className="flex gap-3">
                  <form action={setFollowMuted.bind(null, f.id, !f.muted)}>
                    <button className="text-muted hover:text-fg">
                      {f.muted ? "Unmute" : "Mute"}
                    </button>
                  </form>
                  <form
                    action={setFollowing.bind(
                      null,
                      {
                        makerId: f.makerId ?? undefined,
                        projectId: f.projectId ?? undefined,
                      },
                      false,
                    )}
                  >
                    <button className="text-red">Unfollow</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
