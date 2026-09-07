import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { slugify, USERNAME_MIN } from "@/lib/username";

export async function usernameTaken(name: string, exceptUserId?: string) {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(
      exceptUserId
        ? and(eq(user.username, name), ne(user.id, exceptUserId))
        : eq(user.username, name),
    );
  return rows.length > 0;
}

// ponytail: read-then-write, so two simultaneous sign-ups picking the same base
// can collide — the unique index rejects the loser. Add a retry if that ever
// shows up in the logs.
async function firstFree(base: string) {
  if (!(await usernameTaken(base))) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!(await usernameTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// Sign-ups choose their own handle. Google sign-ins never see that form, so
// they get an opaque placeholder to change on the account page — nothing from
// the Google profile ends up in the URL.
export async function resolveUsername(chosen: string | undefined) {
  const base = slugify(chosen ?? "");
  if (base.length >= USERNAME_MIN) return firstFree(base);
  return firstFree(`member-${Math.random().toString(36).slice(2, 8)}`);
}
