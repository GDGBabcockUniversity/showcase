"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq, ilike, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { click, comment, like, user } from "@/db/schema";
import { actorKey } from "@/lib/actor";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/?authModal=1");
  return session;
}

export async function toggleLike(projectId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  const existing = await db
    .select({ id: like.id })
    .from(like)
    .where(and(eq(like.projectId, projectId), eq(like.userId, userId)));

  if (existing.length > 0) {
    await db.delete(like).where(and(eq(like.projectId, projectId), eq(like.userId, userId)));
  } else {
    await db.insert(like).values({ id: randomUUID(), projectId, userId });
  }

  revalidatePath("/", "layout");
}

export type CommentState = { ok: boolean; error?: string };

export async function addComment(
  projectId: string,
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const session = await requireSession();
  const body = String(formData.get("body") ?? "").trim();

  if (body.length < 2) return { ok: false, error: "Say a bit more." };
  if (body.length > 500) return { ok: false, error: "Keep it under 500 characters." };

  await db.insert(comment).values({ id: randomUUID(), projectId, userId: session.user.id, body });

  revalidatePath(`/project/${projectId}`);
  return { ok: true };
}

// Clicks are anonymous-friendly — don't gate "visit project" behind login.
// Deferred with `after()` so the action returns before the write lands; request
// APIs are allowed inside the callback here because this is a Server Function.
export async function logClick(projectId: string) {
  after(async () => {
    const { key, userId } = await actorKey();
    await db
      .insert(click)
      .values({ id: randomUUID(), projectId, userId, actorKey: key })
      .onConflictDoNothing();
    revalidatePath(`/project/${projectId}`);
  });
}

export type CollaboratorOption = {
  id: string;
  name: string;
  department: string | null;
};

// Typeahead for the submit form's collaborator picker. Signed-in only, since
// this is effectively a directory lookup, and it deliberately returns no email.
export async function searchUsers(query: string): Promise<CollaboratorOption[]> {
  const session = await requireSession();
  const q = query.trim();
  if (q.length < 2) return [];

  return db
    .select({ id: user.id, name: user.name, department: user.department })
    .from(user)
    .where(
      and(
        ilike(user.name, `%${q}%`),
        // you're already on your own project
        ne(user.id, session.user.id),
      ),
    )
    .limit(8);
}
