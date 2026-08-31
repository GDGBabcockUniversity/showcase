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
  getLikedProjectIds,
  getLikedProjects,
  getProjectsByUser,
  type Project,
} from "@/lib/projects";
import { engagementScore } from "@/lib/gauge";
import { ProfileForm } from "@/components/profile-form";

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
  const [shipped, liked, likedIds] = await Promise.all([
    getProjectsByUser(user.id),
    getLikedProjects(user.id),
    getLikedProjectIds(user.id),
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
                {liked.length} liked
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

        <ProjectSection
          title="Shipped"
          subtitle="Projects filed under your account"
          projects={shipped}
          likedIds={likedIds}
          empty={
            <EmptyState
              text="You haven't shipped anything yet."
              href="/submit"
              cta="Put a project on the board →"
            />
          }
        />

        <ProjectSection
          title="Liked"
          subtitle="Projects you've upvoted"
          projects={liked}
          likedIds={likedIds}
          empty={
            <EmptyState
              text="You haven't liked anything yet."
              href="/feed"
              cta="Browse the board →"
            />
          }
        />
      </main>
      <Footer />
    </>
  );
}

function ProjectSection({
  title,
  subtitle,
  projects,
  likedIds,
  empty,
}: {
  title: string;
  subtitle: string;
  projects: Project[];
  likedIds: Set<string>;
  empty: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <div>
          <p className="eyebrow">{title}</p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
            {subtitle}
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {projects.length}
        </span>
      </div>
      {projects.length === 0 ? (
        <div className="mt-4">{empty}</div>
      ) : (
        projects.map((p) => (
          <ProductRow key={p.id} p={p} liked={likedIds.has(p.id)} />
        ))
      )}
    </section>
  );
}
