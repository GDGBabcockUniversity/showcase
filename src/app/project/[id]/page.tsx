import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { UpvoteButton } from "@/components/upvote-button";
import { CommentForm } from "@/components/comment-form";
import { MediaSlider } from "@/components/media-slider";
import { VisitLink } from "@/components/visit-link";
import { BookmarkButton } from "@/components/bookmark-button";
import { SignInTrigger } from "@/components/sign-in-trigger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getAllProjects,
  getCommentsForProject,
  getBookmarkedProjectIds,
  getLikedProjectIds,
  getProjectById,
  getProjectMakers,
  recordView,
} from "@/lib/projects";
import { auth } from "@/lib/auth";
import { actorKey, currentClientIp } from "@/lib/actor";
import { TYPE_LABEL } from "@/lib/departments";
import { TAG_LABEL, type Tag } from "@/lib/tags";
import { coverGradient } from "@/lib/cover";
import { formatDistanceToNow } from "date-fns";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { collaborationRequest, follow } from "@/db/schema";
import {
  ShareLink,
  FollowButton,
  CollaborationForm,
} from "@/components/community-controls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return { title: "Project not found" };
  const title = `${project.title} — GDG Babcock Showcase`;
  return {
    title,
    description: project.summary,
    openGraph: project.cover
      ? { title, description: project.summary, images: [project.cover] }
      : undefined,
    twitter: project.cover
      ? {
          card: "summary_large_image",
          title,
          description: project.summary,
          images: [project.cover],
        }
      : undefined,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProjectById(id);
  if (!p) notFound();

  const session = await auth.api.getSession({ headers: await headers() });

  // Resolve the actor and IP now (reads request headers, only legal during
  // render), then write the view after the response is sent so it never
  // blocks the page.
  const actor = await actorKey(session);
  const ip = await currentClientIp();
  after(() => recordView(id, actor, ip));

  const [allProjects, likedIds, savedIds, comments, makers] = await Promise.all(
    [
      getAllProjects(),
      session
        ? getLikedProjectIds(session.user.id)
        : Promise.resolve(new Set<string>()),
      session
        ? getBookmarkedProjectIds(session.user.id)
        : Promise.resolve(new Set<string>()),
      getCommentsForProject(id),
      getProjectMakers(id),
    ],
  );
  const isOwner = session?.user.id === p.ownerId;
  const [projectFollow] =
    session && !isOwner
      ? await db
          .select({ id: follow.id })
          .from(follow)
          .where(
            and(eq(follow.userId, session.user.id), eq(follow.projectId, p.id)),
          )
      : [];
  const [myOpenRequest] =
    session && !isOwner
      ? await db
          .select({ id: collaborationRequest.id })
          .from(collaborationRequest)
          .where(
            and(
              eq(collaborationRequest.projectId, p.id),
              eq(collaborationRequest.senderId, session.user.id),
              eq(collaborationRequest.status, "OPEN"),
            ),
          )
      : [];
  const ranked = [...allProjects].sort((a, b) => b.signalScore - a.signalScore);
  const rank = ranked.findIndex((x) => x.id === p.id) + 1;
  const total = ranked.length;

  const related = [
    ...allProjects.filter(
      (i) => i.id !== p.id && i.department === p.department,
    ),
    ...allProjects.filter(
      (i) => i.id !== p.id && i.department !== p.department,
    ),
  ].slice(0, 4);

  const slides = p.media;
  const topComments = comments.filter((comment) => !comment.parentId);
  const repliesByComment = new Map<string, typeof comments>();
  for (const comment of comments) {
    if (!comment.parentId) continue;
    const replies = repliesByComment.get(comment.parentId) ?? [];
    replies.push(comment);
    repliesByComment.set(comment.parentId, replies);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
        {/* Header row */}
        <header className="mt-8 grid gap-8 border-b border-border pb-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0">
            <div className="mt-3 flex items-center gap-4">
              {p.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover sm:h-20 sm:w-20"
                />
              ) : (
                <div
                  className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20"
                  style={{ background: coverGradient(p.title) }}
                  aria-hidden
                />
              )}
              <h1 className="min-w-0 break-words font-display text-[2.75rem] font-bold leading-[0.95] tracking-tight sm:text-6xl">
                {p.title}
              </h1>
            </div>
            <div className="mt-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Shipped by
              </p>
              <ul className="mt-3 flex flex-wrap items-center gap-2">
                {makers.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/u/${m.username}`}
                      className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:border-blue/60 hover:text-blue"
                    >
                      <Avatar className="size-7 border border-border">
                        {m.image && <AvatarImage src={m.image} alt="" />}
                        <AvatarFallback className="font-display text-xs font-semibold">
                          {m.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {m.username ? `@${m.username}` : m.name}
                      </span>
                      {m.owner && (
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                          Maker
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <ShareLink url={`/project/${p.id}`} title="project" />
            {session && !isOwner && (
              <FollowButton projectId={p.id} following={!!projectFollow} />
            )}
            <UpvoteButton
              key={`${p.id}-${likedIds.has(p.id)}-${p.likes}`}
              id={p.id}
              initial={p.likes}
              liked={likedIds.has(p.id)}
              size="lg"
            />
            <div className="flex items-center gap-2">
              <VisitLink id={p.id} url={p.url} />
              <BookmarkButton
                key={`${p.id}-${savedIds.has(p.id)}`}
                id={p.id}
                saved={savedIds.has(p.id)}
                size="lg"
              />
            </div>
            {isOwner && (
              <Link
                href={`/project/${p.id}/edit`}
                className="font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-blue"
              >
                Edit project
              </Link>
            )}
          </div>
        </header>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left column */}
          <div className="min-w-0">
            {/* Gallery — extra media only; the cover shows by the title instead. */}
            {slides.length > 0 && (
              <figure id="overview">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
                  <span>{"// media"}</span>
                  <span>{String(slides.length).padStart(2, "0")} total</span>
                </div>
                <MediaSlider images={slides} title={p.title} />
              </figure>
            )}

            {/* About */}
            <section className="mt-12">
              <p className="eyebrow">About the build</p>
              <p className="mt-4 max-w-2xl break-words text-base leading-relaxed text-fg">
                {p.summary}
              </p>
              <p className="mt-4 max-w-2xl break-words text-sm leading-relaxed text-muted">
                Filed as a {TYPE_LABEL[p.type].toLowerCase()} project by a maker
                in {p.department.toLowerCase()}. Every submission is read by a
                reviewer before it lands on the board, so being here means
                someone signed off on what {p.by.split(" ")[0]} shipped.
              </p>
            </section>

            {p.openToCollaboration && (
              <section
                aria-labelledby="collaboration-heading"
                className="mt-10 border-y border-green/30 bg-green/5 px-4 py-5 sm:px-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-green">Open collaboration</p>
                    <h2
                      id="collaboration-heading"
                      className="mt-2 font-display text-xl font-semibold tracking-tight"
                    >
                      Help build what comes next
                    </h2>
                  </div>
                  <span className="rounded-full border border-green/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-green">
                    Accepting requests
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  {p.by} is open to working with other makers on this project.
                </p>
                {p.requestedSkills.length > 0 && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      Helpful skills
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {p.requestedSkills.map((skill) => (
                        <li
                          key={skill}
                          className="border border-green/25 px-2.5 py-1 text-xs text-fg/90"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {session && !isOwner ? (
                  myOpenRequest ? (
                    <p
                      role="status"
                      className="mt-5 border-t border-green/20 pt-4 text-sm text-green"
                    >
                      Your request is with the maker. You can follow this
                      project to keep up with new work.
                    </p>
                  ) : (
                    <CollaborationForm projectId={p.id} />
                  )
                ) : !session ? (
                  <p className="mt-5 border-t border-green/20 pt-4 text-sm text-muted">
                    <SignInTrigger className="font-medium text-blue hover:underline">
                      Sign in
                    </SignInTrigger>{" "}
                    to introduce yourself to the maker.
                  </p>
                ) : (
                  <p className="mt-5 border-t border-green/20 pt-4 text-sm text-muted">
                    You’re listed as a maker on this project.{" "}
                    <Link
                      href="/account#collaboration-requests"
                      className="text-blue hover:underline"
                    >
                      View incoming requests
                    </Link>
                    .
                  </p>
                )}
              </section>
            )}

            {/* Comments */}
            <section
              id="comments"
              className="mt-12 border-t border-border pt-10"
            >
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <p className="eyebrow">Comments</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                    What people are saying
                  </h2>
                </div>
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {topComments.length}
                </span>
              </div>

              {session ? (
                <CommentForm projectId={p.id} />
              ) : (
                <p className="mt-4 text-sm text-muted">
                  <SignInTrigger className="text-blue hover:underline">
                    Sign in
                  </SignInTrigger>{" "}
                  to leave a comment.
                </p>
              )}

              {topComments.length > 0 ? (
                <ol className="mt-6 space-y-5">
                  {topComments.map((c) => (
                    <li
                      key={c.id}
                      className="border-b border-border pb-5 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          aria-hidden
                          className="mt-0.5 border border-border"
                        >
                          <AvatarImage src={c.image ?? undefined} alt="" />
                          <AvatarFallback
                            className="font-display text-xs font-semibold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, var(--color-blue), var(--color-green))",
                            }}
                          >
                            {c.by.trim()[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <Link
                              href={`/u/${c.username ?? c.userId}`}
                              className="min-w-0 break-words text-sm font-medium transition-colors hover:text-blue"
                            >
                              {c.by}
                            </Link>
                            <p className="font-mono text-[10px] tracking-wider text-muted">
                              {formatDistanceToNow(c.createdAt, {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <p className="mt-1.5 break-words text-sm leading-relaxed text-muted">
                            {c.body}
                          </p>
                          {(repliesByComment.get(c.id)?.length ?? 0) > 0 && (
                            <ol className="mt-4 space-y-4 border-l border-border pl-4">
                              {repliesByComment.get(c.id)?.map((reply) => (
                                <li key={reply.id}>
                                  <div className="flex items-baseline justify-between gap-3">
                                    <Link
                                      href={`/u/${reply.username ?? reply.userId}`}
                                      className="text-xs font-medium hover:text-blue"
                                    >
                                      {reply.by}
                                    </Link>
                                    <span className="font-mono text-[10px] text-muted">
                                      {formatDistanceToNow(reply.createdAt, {
                                        addSuffix: true,
                                      })}
                                    </span>
                                  </div>
                                  <p className="mt-1 break-words text-sm leading-relaxed text-muted">
                                    {reply.body}
                                  </p>
                                </li>
                              ))}
                            </ol>
                          )}
                          {session && (
                            <details className="mt-3">
                              <summary className="w-fit cursor-pointer text-xs text-blue hover:underline">
                                Reply
                              </summary>
                              <CommentForm projectId={p.id} parentId={c.id} />
                            </details>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-6 text-sm text-muted">
                  No comments yet — be the first to say something.
                </p>
              )}
            </section>

            {/* Related */}
            <section
              id="related"
              className="mt-12 border-t border-border pt-10"
            >
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <p className="eyebrow">Related on the board</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                    Next to look at
                  </h2>
                </div>
                <Link
                  href="/"
                  className="font-mono text-[11px] uppercase tracking-wider text-blue hover:underline"
                >
                  All projects →
                </Link>
              </div>
              <ol className="mt-6 divide-y divide-border border-y border-border">
                {related.map((item, i) => (
                  <li key={item.id}>
                    <Link
                      href={`/project/${item.id}`}
                      className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 py-4"
                    >
                      <span className="font-mono text-xs text-muted tabular-nums">
                        № {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-lg font-semibold group-hover:text-blue">
                          {item.title}
                        </span>
                        <span className="block truncate font-mono text-[11px] uppercase tracking-wider text-muted">
                          {item.department} · {TYPE_LABEL[item.type]}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* Right rail */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Rank card — the moment */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="eyebrow">On the board</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-2xl text-muted">№</span>
                <span className="font-display text-6xl font-bold leading-none tabular-nums">
                  {String(rank).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs text-muted">of {total}</span>
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                Ranked by last night&apos;s signal score.
              </p>
            </div>

            {/* Meta rail */}
            <dl className="rounded-2xl border border-border bg-surface p-6">
              <p className="eyebrow">Project info</p>
              <div className="mt-4 divide-y divide-border">
                {[
                  { label: "Department", value: p.department },
                  { label: "Type", value: TYPE_LABEL[p.type] },
                  ...(p.tags.length > 0
                    ? [
                        {
                          label: "Topics",
                          value: p.tags
                            .map((t) => TAG_LABEL[t as Tag] ?? t)
                            .join(", "),
                        },
                      ]
                    : []),
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {row.label}
                    </dt>
                    <dd className="min-w-0 break-words text-right text-sm font-medium">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </div>
            </dl>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
