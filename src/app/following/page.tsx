import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { LuArrowUpRight, LuBellOff, LuUserRound } from "react-icons/lu";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { coverGradient } from "@/lib/cover";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { follow, project, user } from "@/db/schema";
import { getAllProjects } from "@/lib/projects";
import { setFollowMuted, setFollowing } from "@/app/community-actions";

function FollowedProject({
  project: item,
}: {
  project: Awaited<ReturnType<typeof getAllProjects>>[number];
}) {
  const publishedAt = item.publishedAt ?? item.createdAt;
  return (
    <article className="grid gap-4 border-b border-border py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-5">
      <Link
        href={`/project/${item.id}`}
        aria-label={`Open ${item.title}`}
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border text-2xl font-semibold text-white transition-opacity hover:opacity-80"
        style={
          item.cover ? undefined : { background: coverGradient(item.title) }
        }
      >
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          item.title[0]
        )}
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link
            href={`/project/${item.id}`}
            className="font-display text-lg font-semibold tracking-tight hover:text-blue"
          >
            {item.title}
          </Link>
          {item.openToCollaboration && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-green">
              Open to collaborators
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
          {item.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted">
          <span>By {item.by}</span>
          <span aria-hidden="true">·</span>
          <span>{item.department}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={publishedAt.toISOString()}>
            {publishedAt.toLocaleDateString("en", {
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>
        {item.tags.length > 0 && (
          <ul
            aria-label="Project topics"
            className="mt-3 flex flex-wrap gap-1.5"
          >
            {item.tags.slice(0, 4).map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-blue/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-blue"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default async function FollowingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/?authModal=1&redirect=/following");

  const [follows, projects] = await Promise.all([
    db
      .select({
        id: follow.id,
        makerId: follow.makerId,
        projectId: follow.projectId,
        muted: follow.muted,
        createdAt: follow.createdAt,
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
  ]);

  const active = follows.filter((item) => !item.muted);
  const items = projects
    .filter((item) =>
      active.some(
        (itemFollow) =>
          itemFollow.projectId === item.id ||
          itemFollow.makerId === item.ownerId,
      ),
    )
    .sort(
      (a, b) =>
        (b.publishedAt?.getTime() ?? b.createdAt.getTime()) -
        (a.publishedAt?.getTime() ?? a.createdAt.getTime()),
    );

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-12">
        <header className="border-b border-border pb-7">
          <p className="eyebrow flex items-center gap-2">
            <LuUserRound size={13} aria-hidden="true" /> Your circle
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Following
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                New projects from makers and projects you chose to keep up with.
              </p>
            </div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              {items.length} {items.length === 1 ? "project" : "projects"} ·{" "}
              {active.length} active follows
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
          <section aria-labelledby="feed-heading" className="min-w-0">
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
              <h2
                id="feed-heading"
                className="font-display text-xl font-semibold"
              >
                Recent work
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                newest first
              </span>
            </div>

            {items.length > 0 ? (
              <div>
                {items.map((item) => (
                  <FollowedProject key={item.id} project={item} />
                ))}
              </div>
            ) : follows.length === 0 ? (
              <div className="mt-5 border border-dashed border-border px-5 py-8 sm:px-8">
                <p className="eyebrow">Your feed is ready</p>
                <h3 className="mt-3 font-display text-xl font-semibold">
                  Follow a maker or a project to get started.
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                  Their published work will appear here, with the latest
                  projects at the top.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-blue px-4 text-sm font-medium text-white transition-colors hover:bg-blue/85"
                >
                  Explore projects{" "}
                  <LuArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            ) : active.length === 0 ? (
              <p
                role="status"
                className="mt-5 border border-border bg-surface px-5 py-6 text-sm leading-relaxed text-muted"
              >
                Your follows are muted, so this feed is paused. Unmute a maker
                or project to see their new work here.
              </p>
            ) : (
              <p
                role="status"
                className="mt-5 border border-border bg-surface px-5 py-6 text-sm leading-relaxed text-muted"
              >
                No published projects from your follows yet. We’ll show them
                here when they ship.
              </p>
            )}
          </section>

          <aside aria-labelledby="manage-heading" className="min-w-0">
            <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
              <h2
                id="manage-heading"
                className="font-display text-xl font-semibold"
              >
                Your follows
              </h2>
              <span className="font-mono text-xs tabular-nums text-muted">
                {follows.length}
              </span>
            </div>
            {follows.length > 0 ? (
              <ul className="divide-y divide-border">
                {follows.map((item) => {
                  const maker = !!item.makerId;
                  const label = maker
                    ? item.makerUsername
                      ? `@${item.makerUsername}`
                      : (item.makerName ?? "Unavailable maker")
                    : (item.projectTitle ?? "Unavailable project");
                  const href = maker
                    ? `/u/${item.makerUsername ?? item.makerId}`
                    : `/project/${item.projectId}`;
                  return (
                    <li key={item.id} className="py-4">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                            {maker ? "Maker" : "Project"}
                          </span>
                          <Link
                            href={href}
                            className="mt-1 block truncate text-sm font-medium hover:text-blue"
                          >
                            {label}
                          </Link>
                        </div>
                        {item.muted && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-1 font-mono text-[9px] uppercase text-muted">
                            <LuBellOff size={11} aria-hidden="true" /> Muted
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <form
                          action={setFollowMuted.bind(
                            null,
                            item.id,
                            !item.muted,
                          )}
                        >
                          <button
                            type="submit"
                            aria-label={`${item.muted ? "Unmute" : "Mute"} ${label}`}
                            className="text-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg"
                          >
                            {item.muted ? "Unmute feed" : "Mute feed"}
                          </button>
                        </form>
                        <form
                          action={setFollowing.bind(
                            null,
                            {
                              makerId: item.makerId ?? undefined,
                              projectId: item.projectId ?? undefined,
                            },
                            false,
                          )}
                        >
                          <button
                            type="submit"
                            aria-label={`Unfollow ${label}`}
                            className="text-red underline decoration-red/40 underline-offset-4 hover:decoration-red"
                          >
                            Unfollow
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-5 text-sm leading-relaxed text-muted">
                Follow makers from their profile or projects from their project
                page. You can mute a follow without removing it.
              </p>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
