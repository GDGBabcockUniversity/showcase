import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ProductRow } from "@/components/product-row";
import { auth } from "@/lib/auth";
import {
  getBookmarkedProjectIds,
  getBookmarkedProjects,
  getLikedProjectIds,
  getLikedProjects,
  getProjectsByUser,
  type Project,
} from "@/lib/projects";
import { STATUS_LABEL, type ProjectStatus } from "@/lib/project-status";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileForm } from "@/components/profile-form";
import { formatDistanceToNow } from "date-fns";
import { AccountTabs } from "./account-tabs";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { collaborationRequest, project, user as userTable } from "@/db/schema";
import {
  closeCollaborationRequest,
  reportCollaborationRequest,
} from "@/app/community-actions";

export const metadata: Metadata = {
  title: "Account — GDG Babcock Showcase",
  description:
    "Your profile, the projects you've shipped, and what you've liked.",
};

// Three buckets: unfinished, submitted but not yet published, and on the board.
function split(shipped: Project[]) {
  return {
    drafts: shipped.filter((p) => p.draft),
    inReview: shipped.filter((p) => !p.draft && p.status !== "PUBLISHED"),
    live: shipped.filter((p) => !p.draft && p.status === "PUBLISHED"),
  };
}

function EmptyState({
  text,
  href,
  cta,
}: {
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <p className="rounded-2xl border border-border bg-surface py-12 text-center text-sm text-muted">
      {text}{" "}
      <Link href={href} className="text-blue hover:underline">
        {cta}
      </Link>
    </p>
  );
}

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/?authModal=1&redirect=/account");

  const { user } = session;
  const [shipped, liked, saved, likedIds, savedIds] = await Promise.all([
    getProjectsByUser(user.id),
    getLikedProjects(user.id),
    getBookmarkedProjects(user.id),
    getLikedProjectIds(user.id),
    getBookmarkedProjectIds(user.id),
  ]);
  const requests = await db
    .select({
      id: collaborationRequest.id,
      message: collaborationRequest.message,
      senderId: userTable.id,
      sender: userTable.name,
      senderUsername: userTable.username,
      title: project.title,
      projectId: project.id,
      createdAt: collaborationRequest.createdAt,
    })
    .from(collaborationRequest)
    .innerJoin(project, eq(project.id, collaborationRequest.projectId))
    .innerJoin(userTable, eq(userTable.id, collaborationRequest.senderId))
    .where(
      and(eq(project.userId, user.id), eq(collaborationRequest.status, "OPEN")),
    )
    .orderBy(desc(collaborationRequest.createdAt));

  const { drafts, inReview, live } = split(shipped);

  const totals = live.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      clicks: acc.clicks + p.clicks,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
    }),
    { views: 0, clicks: 0, likes: 0, comments: 0 },
  );

  const stats: { label: string; value: string }[] = [
    { label: "Views", value: totals.views.toLocaleString() },
    { label: "Clicks", value: totals.clicks.toLocaleString() },
    { label: "Likes", value: totals.likes.toLocaleString() },
    { label: "Comments", value: totals.comments.toLocaleString() },
  ];

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:py-10">
        <section className="border-b border-border pb-8">
          <p className="eyebrow flex items-center gap-3">
            <Dots />
            Your account
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <AvatarUpload name={user.name} image={user.image ?? null} />
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {user.name}
              </h1>
              <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
              {(user.department || user.level) && (
                <p className="mt-1 text-sm text-muted">
                  {[user.department, user.level && `${user.level} level`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                Member since {memberSince} · {shipped.length} shipped ·{" "}
                {liked.length} liked · {saved.length} saved
              </p>
            </div>
          </div>
        </section>

        {/* Editable details */}
        <section className="mt-8">
          <p className="eyebrow">Your details</p>
          <ProfileForm
            name={user.name}
            username={user.username ?? ""}
            bio={user.bio ?? ""}
            email={user.email}
            department={user.department ?? null}
            level={user.level ?? null}
          />
        </section>

        <section id="collaboration-requests" className="mt-10 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="eyebrow">Maker inbox</p>
              <h2 className="mt-1 font-display text-xl font-semibold">
                Collaboration requests
              </h2>
            </div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              {requests.length} open
            </span>
          </div>
          {requests.length > 0 ? (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {requests.map((request) => (
                <li key={request.id} className="py-5 sm:px-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        <Link
                          href={`/u/${request.senderUsername ?? request.senderId}`}
                          className="break-words hover:text-blue"
                        >
                          {request.senderUsername
                            ? `@${request.senderUsername}`
                            : request.sender}
                        </Link>
                        <span className="px-2 text-muted" aria-hidden="true">
                          →
                        </span>
                        <Link
                          href={`/project/${request.projectId}`}
                          className="break-words text-muted hover:text-blue"
                        >
                          {request.title}
                        </Link>
                      </p>
                      <time
                        dateTime={request.createdAt.toISOString()}
                        className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted"
                      >
                        Received{" "}
                        {formatDistanceToNow(request.createdAt, {
                          addSuffix: true,
                        })}
                      </time>
                    </div>
                    <span className="shrink-0 border border-green/30 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-green">
                      Open
                    </span>
                  </div>
                  <blockquote className="mt-4 break-words whitespace-pre-wrap border-l-2 border-green/40 pl-3 text-sm leading-relaxed text-fg/90">
                    {request.message}
                  </blockquote>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <form
                      action={closeCollaborationRequest.bind(null, request.id)}
                    >
                      <button
                        type="submit"
                        className="min-h-9 text-xs font-medium text-green underline decoration-green/40 underline-offset-4 hover:decoration-green"
                      >
                        Mark as handled
                      </button>
                    </form>
                    <form
                      action={reportCollaborationRequest.bind(null, request.id)}
                    >
                      <button
                        type="submit"
                        className="min-h-9 text-xs text-muted underline decoration-border underline-offset-4 hover:text-red hover:decoration-red/50"
                      >
                        Report request
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p
              role="status"
              className="mt-4 border border-dashed border-border px-4 py-5 text-sm leading-relaxed text-muted"
            >
              No open requests right now. Projects marked as open to
              collaboration will appear here when someone reaches out.
            </p>
          )}
        </section>

        {/* Signal earned across their own projects */}
        <p className="mt-6">
          <Link
            href="/account/analytics"
            className="text-sm text-blue hover:underline"
          >
            View project analytics →
          </Link>
        </p>
        <section className="mt-8">
          <p className="eyebrow">Signal earned</p>
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface p-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Totalled across everything you&apos;ve shipped.
          </p>
        </section>

        <AccountTabs
          counts={{
            shipped: shipped.length,
            liked: liked.length,
            saved: saved.length,
          }}
          shipped={
            <>
              <DraftList drafts={drafts} />
              <InReviewList projects={inReview} />
              <ProjectList
                projects={live}
                likedIds={likedIds}
                savedIds={savedIds}
                owned
                empty={
                  drafts.length + inReview.length > 0 ? null : (
                    <EmptyState
                      text="You haven't shipped anything yet."
                      href="/submit"
                      cta="Put a project on the board →"
                    />
                  )
                }
              />
            </>
          }
          liked={
            <ProjectList
              projects={liked}
              likedIds={likedIds}
              savedIds={savedIds}
              empty={
                <EmptyState
                  text="You haven't liked anything yet."
                  href="/"
                  cta="Browse the board →"
                />
              }
            />
          }
          saved={
            <ProjectList
              projects={saved}
              likedIds={likedIds}
              savedIds={savedIds}
              empty={
                <EmptyState
                  text="You haven't saved anything yet."
                  href="/"
                  cta="Find something to save →"
                />
              }
            />
          }
        />
      </main>
      <Footer />
    </>
  );
}

// Submitted but not yet published — same shape as the draft list, different
// reason for being invisible.
function InReviewList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-blue/30 bg-blue/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-blue">
        {projects.length} in review
      </p>
      <ul className="mt-2">
        {projects.map((p) => (
          <li
            key={p.id}
            className="border-t border-blue/20 py-2 first:border-t-0"
          >
            <Link
              href={`/project/${p.id}/edit`}
              className="flex items-baseline justify-between gap-4 text-sm hover:text-blue"
            >
              <span className="truncate">{p.title}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
                {STATUS_LABEL[p.status as ProjectStatus]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DraftList({ drafts }: { drafts: Project[] }) {
  if (drafts.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-yellow/30 bg-yellow/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-yellow">
        {drafts.length} draft{drafts.length === 1 ? "" : "s"} — only you can see
        these
      </p>
      <ul className="mt-2">
        {drafts.map((p) => (
          <li
            key={p.id}
            className="border-t border-yellow/20 py-2 first:border-t-0"
          >
            <Link
              href={`/project/${p.id}/edit`}
              className="flex items-baseline justify-between gap-4 text-sm hover:text-blue"
            >
              <span className="truncate">{p.title}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
                Finish it →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectList({
  projects,
  likedIds,
  savedIds,
  empty,
  owned,
}: {
  projects: Project[];
  likedIds: Set<string>;
  savedIds: Set<string>;
  empty: React.ReactNode;
  owned?: boolean;
}) {
  if (projects.length === 0) return <div className="mt-4">{empty}</div>;

  return (
    <div>
      {projects.map((p) => (
        <div key={p.id} className="relative">
          <ProductRow
            p={p}
            liked={likedIds.has(p.id)}
            saved={savedIds.has(p.id)}
          />
          {owned && (
            <Link
              href={`/project/${p.id}/edit`}
              className="absolute right-5 top-2 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:text-blue"
            >
              Edit
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
