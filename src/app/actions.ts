"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq, ilike, inArray, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookmark, click, comment, like, project, user } from "@/db/schema";
import { actorKey } from "@/lib/actor";
import { DEPARTMENTS, LEVELS, PROJECT_TYPES } from "@/lib/departments";
import {
  MAX_COLLABORATORS,
  SUMMARY_MAX,
  SUMMARY_MIN,
  TITLE_MAX,
  TITLE_MIN,
} from "@/lib/limits";

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

export type ProfileState = { ok: boolean; error?: string };

// Profile edits go through better-auth rather than a direct db write, so the
// session it hands back afterwards reflects the new values.
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const department = String(formData.get("department") ?? "");
  const level = String(formData.get("level") ?? "");

  if (name.length < 2) return { ok: false, error: "Name is too short." };
  if (name.length > 80) return { ok: false, error: "Name must be under 80 characters." };
  if (department && !(DEPARTMENTS as readonly string[]).includes(department)) {
    return { ok: false, error: "Pick a department from the list." };
  }
  if (level && !(LEVELS as readonly string[]).includes(level)) {
    return { ok: false, error: "Pick a level from the list." };
  }

  await auth.api.updateUser({
    headers: await headers(),
    body: { name, department: department || null, level: level || null },
  });

  revalidatePath("/account");
  return { ok: true };
}

export async function toggleBookmark(projectId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  const existing = await db
    .select({ id: bookmark.id })
    .from(bookmark)
    .where(and(eq(bookmark.projectId, projectId), eq(bookmark.userId, userId)));

  if (existing.length > 0) {
    await db
      .delete(bookmark)
      .where(and(eq(bookmark.projectId, projectId), eq(bookmark.userId, userId)));
  } else {
    await db.insert(bookmark).values({ id: randomUUID(), projectId, userId });
  }

  revalidatePath("/", "layout");
}

export type EditState = {
  ok: boolean;
  message?: string;
  errors?: Partial<
    Record<"title" | "summary" | "department" | "type" | "url" | "collaborators", string>
  >;
};

// Owner-only. The where clause carries the user id, so a project belonging to
// someone else matches nothing and updates no rows rather than erroring late.
export async function updateProject(
  projectId: string,
  _prev: EditState,
  formData: FormData,
): Promise<EditState> {
  const session = await requireSession();

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const department = String(formData.get("department") ?? "");
  const type = String(formData.get("type") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const collaboratorIds = [
    ...new Set(formData.getAll("collaborators").map(String).filter(Boolean)),
  ].filter((id) => id !== session.user.id);

  const errors: EditState["errors"] = {};
  if (title.length < TITLE_MIN) errors.title = "Give it a real name.";
  if (title.length > TITLE_MAX) errors.title = `Under ${TITLE_MAX} characters.`;
  if (summary.length < SUMMARY_MIN)
    errors.summary = `One full sentence, at least ${SUMMARY_MIN} characters.`;
  if (summary.length > SUMMARY_MAX) errors.summary = `Under ${SUMMARY_MAX} characters.`;
  if (!(DEPARTMENTS as readonly string[]).includes(department))
    errors.department = "Pick a department.";
  if (!(PROJECT_TYPES as readonly string[]).includes(type)) errors.type = "Pick a type.";
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") errors.url = "http or https only.";
    } catch {
      errors.url = "Not a valid URL.";
    }
  }

  let collaborators: string[] = [];
  if (collaboratorIds.length > MAX_COLLABORATORS) {
    errors.collaborators = `Up to ${MAX_COLLABORATORS} collaborators.`;
  } else if (collaboratorIds.length > 0) {
    const found = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.id, collaboratorIds));
    if (found.length !== collaboratorIds.length) {
      errors.collaborators = "One of those accounts no longer exists.";
    }
    collaborators = found.map((f) => f.id);
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Fix the highlighted fields." };
  }

  const updated = await db
    .update(project)
    .set({ title, summary, department, type, url: url || "", collaborators })
    .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)))
    .returning({ id: project.id });

  if (updated.length === 0) return { ok: false, message: "That isn't your project." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function deleteProject(projectId: string) {
  const session = await requireSession();

  const deleted = await db
    .delete(project)
    .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)))
    .returning({ id: project.id });

  // Nothing deleted means it wasn't theirs — don't pretend it worked.
  if (deleted.length === 0) throw new Error("That isn't your project.");

  revalidatePath("/", "layout");
  redirect("/account");
}
