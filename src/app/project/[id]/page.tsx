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
import { actorKey } from "@/lib/actor";
import { TYPE_LABEL } from "@/lib/departments";
import { coverGradient } from "@/lib/cover";
import { engagementScore, type Interactions } from "@/lib/gauge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} — GDG Babcock Showcase`,
    description: project.summary,
  };
}

const METRIC_COLORS = {
  views: "var(--color-blue)",
  clicks: "var(--color-red)",
  likes: "var(--color-yellow)",
  comments: "var(--color-green)",
} as const;

const METRIC_HALF = { views: 400, clicks: 80, likes: 40, comments: 15 } as const;

function contribution(metric: keyof Interactions, value: number) {
  const half = METRIC_HALF[metric];
  return value / (value + half);
}

function MomentumDots({ p }: { p: Interactions }) {
  const metrics: (keyof Interactions)[] = ["views", "clicks", "likes", "comments"];
  return (
    <span
      className="inline-flex items-center gap-2.5"
      aria-label="Momentum by signal"
    >
      {metrics.map((m) => {
        const c = contribution(m, p[m]);
        return (
          <span
            key={m}
            className="relative flex h-4 w-4 items-center justify-center rounded-full"
            style={{ boxShadow: `inset 0 0 0 1px ${METRIC_COLORS[m]}` }}
          >
            <span
              className="rounded-full transition-all"
              style={{
                background: METRIC_COLORS[m],
                width: `${4 + c * 10}px`,
                height: `${4 + c * 10}px`,
              }}
            />
          </span>
        );
      })}
    </span>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProjectById(id);
  if (!p) notFound();

  const engagement = engagementScore(p);

  const session = await auth.api.getSession({ headers: await headers() });

  // Resolve the actor now (reads request headers, only legal during render),
  // then write the view after the response is sent so it never blocks the page.
  const actor = await actorKey(session);
  after(() => recordView(id, actor));

  const [allProjects, likedIds, savedIds, comments, makers] = await Promise.all([
    getAllProjects(),
    session ? getLikedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
    session ? getBookmarkedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
    getCommentsForProject(id),
    getProjectMakers(id),
  ]);
  const isOwner = session?.user.id === p.ownerId;
  const ranked = [...allProjects].sort(
    (a, b) => engagementScore(b) - engagementScore(a),
  );
  const rank = ranked.findIndex((x) => x.id === p.id) + 1;
  const total = ranked.length;

  const related = [
    ...allProjects.filter((i) => i.id !== p.id && i.department === p.department),
    ...allProjects.filter((i) => i.id !== p.id && i.department !== p.department),
  ].slice(0, 4);

  const slides = [p.cover, ...p.media].filter((src): src is string => !!src);

  const metrics: { key: keyof Interactions; label: string }[] = [
    { key: "views", label: "Views" },
    { key: "clicks", label: "Clicks" },
    { key: "likes", label: "Likes" },
    { key: "comments", label: "Comments" },
  ];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">

        {/* Header row */}
        <header className="mt-8 grid gap-8 border-b border-border pb-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0">

            <h1 className="mt-3 break-words font-display text-[2.75rem] font-bold leading-[0.95] tracking-tight sm:text-6xl">
              {p.title}
            </h1>
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
            <UpvoteButton
              key={`${p.id}-${likedIds.has(p.id)}-${p.likes}`}
              id={p.id}
              initial={p.likes}
              liked={likedIds.has(p.id)}
              size="lg"
            />
            <div className="flex items-center gap-2">
              <BookmarkButton
                key={`${p.id}-${savedIds.has(p.id)}`}
                id={p.id}
                saved={savedIds.has(p.id)}
                size="lg"
              />
              <VisitLink id={p.id} url={p.url} />
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
            {/* Cover cell — framed like a film cell */}
            <figure id="overview">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
                <span>{"// media"}</span>
                <span>{String(slides.length || 1).padStart(2, "0")} total</span>
              </div>
              {/* Cover first, then any extra media — one image per slide. The
                  gradient stands in for projects filed before covers were
                  required. */}
              {slides.length > 0 ? (
                <MediaSlider images={slides} title={p.title} />
              ) : (
                <div
                  className="mt-2 aspect-[16/9] w-full rounded-2xl"
                  style={{ background: coverGradient(p.title) }}
                  aria-hidden
                />
              )}
            </figure>

            {/* About */}
            <section className="mt-12">
              <p className="eyebrow">About the build</p>
              <p className="mt-4 max-w-2xl break-words text-base leading-relaxed text-fg">
                {p.summary}
              </p>
              <p className="mt-4 max-w-2xl break-words text-sm leading-relaxed text-muted">
                Filed as a {TYPE_LABEL[p.type].toLowerCase()} project by a
                maker in {p.department.toLowerCase()}. Every submission is
                read by a reviewer before it lands on the board, so being here
                means someone signed off on what {p.by.split(" ")[0]} shipped.
              </p>
            </section>

            {/* Momentum */}
            <section id="momentum" className="mt-12 border-t border-border pt-10">
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <p className="eyebrow">Momentum</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                    How this project is being received
                  </h2>
                </div>
                <span className="font-display text-5xl font-semibold tabular-nums">
                  {engagement.toFixed(1)}
                </span>
              </div>

              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
                {metrics.map((m) => {
                  const c = contribution(m.key, p[m.key]);
                  return (
                    <div key={m.key} className="bg-surface p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                          {m.label}
                        </p>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: METRIC_COLORS[m.key] }}
                        />
                      </div>
                      <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
                        {p[m.key].toLocaleString()}
                      </p>
                      <div className="mt-3 h-1 w-full rounded-full bg-bg">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round(c * 100)}%`,
                            background: METRIC_COLORS[m.key],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 max-w-2xl text-xs text-muted">
                Signal is a weighted composite of the four interactions above.
                Clicks pay most — a click means the visitor left this page for
                the project itself.
              </p>
            </section>

            {/* Comments */}
            <section id="comments" className="mt-12 border-t border-border pt-10">
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <p className="eyebrow">Comments</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                    What people are saying
                  </h2>
                </div>
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {comments.length}
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

              {comments.length > 0 ? (
                <ol className="mt-6 space-y-5">
                  {comments.map((c) => (
                    <li key={c.id} className="border-b border-border pb-5 last:border-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 break-words text-sm font-medium">{c.by}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                          {c.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <p className="mt-1.5 break-words text-sm leading-relaxed text-muted">{c.body}</p>
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
            <section id="related" className="mt-12 border-t border-border pt-10">
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <p className="eyebrow">Related on the board</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                    Next to look at
                  </h2>
                </div>
                <Link href="/feed" className="font-mono text-[11px] uppercase tracking-wider text-blue hover:underline">
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
                      <span className="flex items-center gap-3">
                        <MomentumDots p={item} />
                        <span className="w-10 text-right font-mono text-xs text-blue tabular-nums">
                          {engagementScore(item).toFixed(1)}
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
                Ranked by community signal, updated live.
              </p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Signal now
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <MomentumDots p={p} />
                  <span className="font-display text-2xl font-semibold tabular-nums">
                    {engagement.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Meta rail */}
            <dl className="rounded-2xl border border-border bg-surface p-6">
              <p className="eyebrow">Project info</p>
              <div className="mt-4 divide-y divide-border">
                {[
                  { label: "Department", value: p.department },
                  { label: "Type", value: TYPE_LABEL[p.type] },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {row.label}
                    </dt>
                    <dd className="min-w-0 break-words text-right text-sm font-medium">{row.value}</dd>
                  </div>
                ))}
              </div>
            </dl>

            {/* Rubric note */}
            <div className="rounded-2xl border border-blue/25 bg-blue/5 p-6">
              <p className="eyebrow text-blue/90">Reviewed</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Read end-to-end by a GDG reviewer against the campus rubric
                before it went live. Rejected drafts never appear on the board.
              </p>
              <Link
                href="/#rubric"
                className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-blue hover:underline"
              >
                See the rubric →
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
