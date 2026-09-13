"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, eq, ilike, inArray, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookmark, interaction, project, projectContributor, user } from "@/db/schema";
import { actorKey, currentClientIp, type Actor } from "@/lib/actor";
import { recordInteraction } from "@/lib/interactions";
import { DEPARTMENTS, LEVELS, PROJECT_TYPES } from "@/lib/departments";
import { MAX_TAGS, TAGS } from "@/lib/tags";
import { slugify, USERNAME_MIN } from "@/lib/username";
import { usernameTaken } from "@/lib/username-db";
import {
  BIO_MAX,
  isUploadUrl,
  MAX_COLLABORATORS,
  MAX_EXTRA_MEDIA,
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
  const actor: Actor = { key: `user:${userId}`, userId };

  const existing = await db
    .select({ id: interaction.id })
    .from(interaction)
    .where(and(eq(interaction.projectId, projectId), eq(interaction.userId, userId), eq(interaction.type, "like")));

  if (existing.length > 0) {
    await db.delete(interaction).where(eq(interaction.id, existing[0].id));
  } else {
    await recordInteraction({ projectId, type: "like", actor, ip: await currentClientIp() });
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
  if (body.length > 500)
    return { ok: false, error: "Keep it under 500 characters." };

  const actor: Actor = { key: `user:${session.user.id}`, userId: session.user.id };
  const result = await recordInteraction({
    projectId,
    type: "comment",
    actor,
    body,
    ip: await currentClientIp(),
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.reason === "self" ? "You can't comment on your own project." : "That didn't work.",
    };
  }

  revalidatePath(`/project/${projectId}`);
  return { ok: true };
}

// Clicks are anonymous-friendly — don't gate "visit project" behind login.
// Deferred with `after()` so the action returns before the write lands; request
// APIs are allowed inside the callback here because this is a Server Function.
export async function logClick(projectId: string) {
  after(async () => {
    const actor = await actorKey();
    const ip = await currentClientIp();
    await recordInteraction({ projectId, type: "click", actor, ip });
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
export async function searchUsers(
  query: string,
): Promise<CollaboratorOption[]> {
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
// The bytes go straight from the browser to UploadThing; this only records the
// URL that came back, and only one we actually issued.
export async function updateAvatar(url: string): Promise<ProfileState> {
  await requireSession();
  if (!isUploadUrl(url))
    return { ok: false, error: "That image didn't upload properly." };

  await auth.api.updateUser({ headers: await headers(), body: { image: url } });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const department = String(formData.get("department") ?? "");
  const level = String(formData.get("level") ?? "");
  // Slugified rather than rejected: what they typed becomes what the URL can
  // carry, and only the length and the collision are worth an error.
  const username = slugify(String(formData.get("username") ?? ""));
  const bio = String(formData.get("bio") ?? "").trim();

  if (name.length < 2) return { ok: false, error: "Name is too short." };
  if (name.length > 80)
    return { ok: false, error: "Name must be under 80 characters." };
  if (department && !(DEPARTMENTS as readonly string[]).includes(department)) {
    return { ok: false, error: "Pick a department from the list." };
  }
  if (level && !(LEVELS as readonly string[]).includes(level)) {
    return { ok: false, error: "Pick a level from the list." };
  }

  if (username.length < USERNAME_MIN) {
    return { ok: false, error: `Username needs at least ${USERNAME_MIN} characters.` };
  }
  if (await usernameTaken(username, session.user.id)) {
    return { ok: false, error: "That username is taken." };
  }
  if (bio.length > BIO_MAX) {
    return { ok: false, error: `Bio must be under ${BIO_MAX} characters.` };
  }

  await auth.api.updateUser({
    headers: await headers(),
    body: {
      name,
      username,
      bio: bio || null,
      department: department || null,
      level: level || null,
    },
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
      .where(
        and(eq(bookmark.projectId, projectId), eq(bookmark.userId, userId)),
      );
  } else {
    await db.insert(bookmark).values({ id: randomUUID(), projectId, userId });
  }

  revalidatePath("/", "layout");
}

export type EditState = {
  ok: boolean;
  message?: string;
  errors?: Partial<
    Record<"title" | "summary" | "type" | "tags" | "url" | "collaborators" | "cover" | "media", string>
  >;
};

// Replaces a project's contributor rows wholesale — simpler than diffing,
// and cheap at MAX_COLLABORATORS rows.
async function setContributors(projectId: string, userIds: string[]) {
  await db.delete(projectContributor).where(eq(projectContributor.projectId, projectId));
  if (userIds.length > 0) {
    await db
      .insert(projectContributor)
      .values(userIds.map((userId) => ({ id: randomUUID(), projectId, userId })));
  }
}

// Owner-only. The where clause carries the user id, so a project belonging to
// someone else matches nothing and updates no rows rather than erroring late.
export async function updateProject(
  projectId: string,
  _prev: EditState,
  formData: FormData,
): Promise<EditState> {
  const session = await requireSession();

  const [owned] = await db
    .select({ status: project.status })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)));
  if (!owned) return { ok: false, message: "That isn't your project." };

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const tags = [...new Set(formData.getAll("tags").map(String))].filter((t) =>
    (TAGS as readonly string[]).includes(t),
  );
  const url = String(formData.get("url") ?? "").trim();
  const collaboratorIds = [
    ...new Set(formData.getAll("collaborators").map(String).filter(Boolean)),
  ].filter((id) => id !== session.user.id);
  // Both drop zones post every image they're currently showing, new and kept
  // alike — so what arrives here is the full list, and anything the owner
  // removed simply isn't in it.
  const postedCover = String(formData.get("cover") ?? "").trim();
  const media = formData.getAll("media").map(String).filter(Boolean);

  // "Save draft" keeps the row incomplete and off the board; any other submit
  // is a resubmission and has to clear the same bar as a fresh submission.
  if (formData.get("intent") === "draft") {
    if (title.length < TITLE_MIN) {
      return {
        ok: false,
        errors: { title: "A draft still needs a name." },
        message: "Give the draft a title first.",
      };
    }
    await db
      .update(project)
      .set({
        title: title.slice(0, TITLE_MAX),
        summary: summary.slice(0, SUMMARY_MAX),
        type: (PROJECT_TYPES as readonly string[]).includes(type) ? type : "",
        tags: tags.slice(0, MAX_TAGS),
        url,
        cover: isUploadUrl(postedCover) ? postedCover : null,
        media: media.filter(isUploadUrl).slice(0, MAX_EXTRA_MEDIA),
        draft: true,
      })
      .where(eq(project.id, projectId));
    await setContributors(projectId, collaboratorIds.slice(0, MAX_COLLABORATORS));
    return { ok: true, message: "Draft saved." };
  }

  const errors: EditState["errors"] = {};
  if (title.length < TITLE_MIN) errors.title = "Give it a real name.";
  if (title.length > TITLE_MAX) errors.title = `Under ${TITLE_MAX} characters.`;
  if (summary.length < SUMMARY_MIN)
    errors.summary = `One full sentence, at least ${SUMMARY_MIN} characters.`;
  if (summary.length > SUMMARY_MAX)
    errors.summary = `Under ${SUMMARY_MAX} characters.`;
  if (!(PROJECT_TYPES as readonly string[]).includes(type))
    errors.type = "Pick a type.";
  if (tags.length > MAX_TAGS) errors.tags = `Up to ${MAX_TAGS} topics.`;
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:")
        errors.url = "http or https only.";
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

  if (!postedCover) {
    errors.cover = "Cover image is required.";
  } else if (!isUploadUrl(postedCover)) {
    errors.cover = "That cover didn't upload properly — try again.";
  }

  if (media.length > MAX_EXTRA_MEDIA) {
    errors.media = `Up to ${MAX_EXTRA_MEDIA} extra images.`;
  } else if (media.some((u) => !isUploadUrl(u))) {
    errors.media = "One of those images didn't upload properly — try again.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Fix the highlighted fields." };
  }

  // A project a reviewer sent back for changes goes back into the queue on
  // resubmission. Anything already PUBLISHED stays published — edits to a
  // live project don't pull it back off the board.
  const nextStatus = owned.status === "CHANGES_REQUESTED" ? "PENDING" : owned.status;

  await db
    .update(project)
    .set({ title, summary, type, tags, url: url || "", cover: postedCover, media, draft: false, status: nextStatus })
    .where(eq(project.id, projectId));
  await setContributors(projectId, collaborators);

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: nextStatus === "PENDING" ? "Saved — back with a reviewer." : "Saved.",
  };
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
