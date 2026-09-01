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
import { engagementScore } from "@/lib/gauge";
import { ProfileForm } from "@/components/profile-form";
import { AccountTabs } from "./account-tabs";

export const metadata: Metadata = {
  title: "Account — GDG Babcock Showcase",
  description: "Your profile, the projects you've shipped, and what you've liked.",
};

function EmptyState({ text, href, cta }: { text: string; href: string; cta: string }) {
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

  const totals = shipped.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      clicks: acc.clicks + p.clicks,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
      signal: acc.signal + engagementScore(p),
    }),
    { views: 0, clicks: 0, likes: 0, comments: 0, signal: 0 },
  );

  const stats: { label: string; value: string }[] = [
    { label: "Signal", value: totals.signal.toFixed(1) },
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
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-2xl font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-blue), var(--color-green))",
                }}
                aria-hidden
              >
                {user.name[0]}
              </span>
            )}
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
            email={user.email}
            department={user.department ?? null}
            level={user.level ?? null}
          />
        </section>

        {/* Signal earned across their own projects */}
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
          counts={{ shipped: shipped.length, liked: liked.length, saved: saved.length }}
          shipped={
            <ProjectList
              projects={shipped}
              likedIds={likedIds}
              savedIds={savedIds}
              owned
              empty={
                <EmptyState
                  text="You haven't shipped anything yet."
                  href="/submit"
                  cta="Put a project on the board →"
                />
              }
            />
          }
          liked={
            <ProjectList
              projects={liked}
              likedIds={likedIds}
              savedIds={savedIds}
              empty={
                <EmptyState
                  text="You haven't liked anything yet."
                  href="/feed"
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
                  href="/feed"
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
          <ProductRow p={p} liked={likedIds.has(p.id)} saved={savedIds.has(p.id)} />
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
