import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { resolveUsername } from "@/lib/username-db";
import { normalizeEmail } from "@/lib/email";
import { ACCESS_COOKIE, AUTH_API_URL, gdgFetch, type GdgUser } from "@/lib/gdg-auth";

// Sessions come from the GDG auth service (same flow as RADAR): the browser
// signs in with Firebase, /api/auth/session trades that ID token for GDG
// access/refresh tokens kept in httpOnly cookies. The local `user` row still
// holds everything showcase-specific (username, role, department…).

// Accounts made before the switch keep their id (and so their projects):
// they're matched by email, new ones take the GDG id.
export async function upsertLocalUser(gdg: GdgUser) {
  const email = normalizeEmail(gdg.email);
  const [existing] = await db.select().from(user).where(eq(user.email, email));
  if (existing) return existing;
  const [created] = await db
    .insert(user)
    .values({
      id: gdg.id,
      email,
      name: gdg.full_name?.trim() || email,
      image: gdg.avatar_url ?? null,
      emailVerified: true,
      username: await resolveUsername(undefined),
    })
    .onConflictDoNothing()
    .returning();
  // Lost a race with a parallel first sign-in: the other request inserted it.
  return created ?? (await db.select().from(user).where(eq(user.email, email)))[0];
}

// One /auth/me round trip per request, however many components ask.
const sessionForToken = cache(async (token: string) => {
  if (!AUTH_API_URL) return null;
  try {
    const res = await gdgFetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const gdg = (await res.json())?.user as GdgUser | undefined;
    if (!gdg?.id || !gdg.email) return null;
    return { user: await upsertLocalUser(gdg) };
  } catch {
    return null;
  }
});

export type Session = NonNullable<Awaited<ReturnType<typeof sessionForToken>>>;

function readCookie(headers: Headers, name: string) {
  for (const part of (headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

async function getSession({ headers }: { headers: Headers }): Promise<Session | null> {
  const token = readCookie(headers, ACCESS_COOKIE);
  return token ? sessionForToken(token) : null;
}

type UserUpdate = Partial<Pick<typeof user.$inferInsert, "name" | "image" | "username" | "bio" | "department" | "level">>;

async function updateUser({ headers, body }: { headers: Headers; body: UserUpdate }) {
  const session = await getSession({ headers });
  if (!session) throw new Error("Not signed in");
  await db.update(user).set({ ...body, updatedAt: new Date() }).where(eq(user.id, session.user.id));
}

// Same surface callers used under better-auth, so they didn't need to change.
export const auth = { api: { getSession, updateUser } };
