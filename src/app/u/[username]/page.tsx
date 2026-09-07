import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ProductRow } from "@/components/product-row";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  getBookmarkedProjectIds,
  getLikedProjectIds,
  getPublicProjectsByUser,
} from "@/lib/projects";
import { engagementScore } from "@/lib/gauge";

async function getProfile(handle: string) {
  
  const rows = await db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      image: user.image,
      department: user.department,
      level: user.level,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(or(eq(user.username, handle), eq(user.id, handle)));
  return rows[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "Profile not found" };
  return {
    title: `${profile.name} — GDG Babcock Showcase`,
    description: `Projects ${profile.name} has shipped on the board.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const [projects, likedIds, savedIds] = await Promise.all([
    getPublicProjectsByUser(profile.id),
    session ? getLikedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
    session ? getBookmarkedProjectIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  const signal = projects.reduce((sum, p) => sum + engagementScore(p), 0);
  const memberSince = profile.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-10">
        <p className="eyebrow flex items-center gap-3">
          <Dots />
          Profile
        </p>

        <section className="mt-6 flex flex-wrap items-center gap-5 border-b border-border pb-8">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-2xl font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, var(--color-blue), var(--color-green))",
              }}
              aria-hidden
            >
              {profile.name[0]}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {profile.name}
            </h1>
            {profile.username && (
              <p className="font-mono text-sm text-muted">@{profile.username}</p>
            )}
            {(profile.department || profile.level) && (
              <p className="mt-1 text-sm text-muted">
                {[profile.department, profile.level && `${profile.level} level`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {profile.bio && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg">{profile.bio}</p>
            )}
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              Member since {memberSince} · {projects.length} on the board ·{" "}
              {signal.toFixed(1)} signal
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="border-b border-border pb-3 font-display text-xl font-semibold tracking-tight">
            Projects
          </h2>
          {projects.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface py-12 text-center text-sm text-muted">
              Nothing on the board yet.
            </p>
          ) : (
            projects.map((p) => (
              <ProductRow
                key={p.id}
                p={p}
                liked={likedIds.has(p.id)}
                saved={savedIds.has(p.id)}
              />
            ))
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
