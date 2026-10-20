"use server";

import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { PROJECT_TYPES } from "@/lib/departments";
import { MAX_TAGS, TAGS, TAG_LABEL } from "@/lib/tags";
import { auth } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  project,
  projectContributor,
  projectTag,
  tag,
  user,
} from "@/db/schema";
import {
  isUploadUrl,
  MAX_COLLABORATORS,
  MAX_EXTRA_MEDIA,
  SUMMARY_MAX,
  SUMMARY_MIN,
  TITLE_MAX,
  TITLE_MIN,
} from "@/lib/limits";
import { type SubmitState } from "./submit-form";

export async function submitProject(
  _: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return {
        ok: false,
        message:
          "Your session expired. Sign in again, then return here to restore your progress.",
      };
    }
    return await saveProject(session.user.id, formData);
  } catch (error) {
    console.error("Project submission failed", error);
    return {
      ok: false,
      message:
        "We couldn’t confirm your submission. Your progress is kept in this browser. Try again; retrying will not create another project.",
    };
  }
}

async function saveProject(
  userId: string,
  formData: FormData,
): Promise<SubmitState> {
  const id = String(formData.get("submissionId") ?? "");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return {
      ok: false,
      message: "Reload this page to restore your draft before trying again.",
    };
  }
  // Draft saves keep whatever's filled in so far — the only hard requirement
  // is a title to recognise it by. Everything else is checked on publish.
  const draft = formData.get("intent") === "draft";

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  // Checkbox chips, one value each — anything not in the vocabulary is dropped.
  const tags = [...new Set(formData.getAll("tags").map(String))].filter((t) =>
    (TAGS as readonly string[]).includes(t),
  );
  const url = String(formData.get("url") ?? "").trim();
  // The picker submits user ids, one hidden input each.
  const collaboratorIds = [
    ...new Set(
      formData
        .getAll("collaborators")
        .map((v) => String(v))
        .filter(Boolean),
    ),
  ].filter((id) => id !== userId);
  // UploadThing URLs, posted by the drop zones — the bytes never touch this action.
  const cover = String(formData.get("cover") ?? "").trim();
  const media = formData.getAll("media").map(String).filter(Boolean);

  const errors: SubmitState["errors"] = {};
  if (!draft) {
    if (title.length < TITLE_MIN) errors.title = "Give it a real name.";
    if (title.length > TITLE_MAX)
      errors.title = `Under ${TITLE_MAX} characters.`;
    if (summary.length < SUMMARY_MIN)
      errors.summary = `One full sentence, at least ${SUMMARY_MIN} characters.`;
    if (summary.length > SUMMARY_MAX)
      errors.summary = `Under ${SUMMARY_MAX} characters.`;
    if (!(PROJECT_TYPES as readonly string[]).includes(type))
      errors.type = "Pick a type.";
    if (url) {
      try {
        const u = new URL(url);
        if (u.protocol !== "http:" && u.protocol !== "https:")
          errors.url = "http or https only.";
      } catch {
        errors.url = "Not a valid URL.";
      }
    }
  } else if (title.length < TITLE_MIN) {
    errors.title = "A draft still needs a name.";
  }
  if (tags.length > MAX_TAGS) errors.tags = `Up to ${MAX_TAGS} topics.`;

  // Never trust ids straight off the form — resolve them against real accounts.
  // The names that come back are what the receipt shows.
  let collaborators: { id: string; name: string }[] = [];
  if (collaboratorIds.length > MAX_COLLABORATORS) {
    errors.collaborators = `Up to ${MAX_COLLABORATORS} collaborators.`;
  } else if (collaboratorIds.length > 0) {
    collaborators = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(inArray(user.id, collaboratorIds));
    if (collaborators.length !== collaboratorIds.length) {
      errors.collaborators = "One of those accounts no longer exists.";
    }
  }

  // Size and MIME are enforced by the upload route; here we only check that
  // what came back is a URL we actually issued.
  if (!draft && !cover) {
    errors.cover = "Cover image is required.";
  } else if (cover && !isUploadUrl(cover)) {
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

  // Denormalized onto the project at submit time so cohort/ranking queries
  // never need to join back to `user`.
  const [submitter] = await db
    .select({ department: user.department })
    .from(user)
    .where(eq(user.id, userId));

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(project)
      .values({
        id,
        userId: userId,
        title: title.slice(0, TITLE_MAX),
        summary: summary.slice(0, SUMMARY_MAX),
        type: (PROJECT_TYPES as readonly string[]).includes(type) ? type : "",
        url: url || "",
        cover: cover || null,
        media,
        department: submitter?.department ?? null,
        draft,
        status: "PENDING",
      })
      .onConflictDoNothing({ target: project.id })
      .returning({ id: project.id });
    if (!created) {
      // A retry after a lost response returns the original result, never a duplicate.
      const [existing] = await tx
        .select()
        .from(project)
        .where(eq(project.id, id));
      if (!existing || existing.userId !== userId) {
        return {
          ok: false,
          message:
            "This submission could not be saved. Please start a new draft.",
        };
      }
      const existingCollaborators = await tx
        .select({ name: user.name })
        .from(projectContributor)
        .innerJoin(user, eq(user.id, projectContributor.userId))
        .where(eq(projectContributor.projectId, id));
      return existing.draft
        ? { ok: true, draftId: id }
        : {
            ok: true,
            receipt: {
              title: existing.title,
              collaborators: existingCollaborators.map((c) => c.name),
              media: (existing.cover ? 1 : 0) + existing.media.length,
            },
          };
    }
    if (collaborators.length > 0) {
      await tx
        .insert(projectContributor)
        .values(
          collaborators.map((c) => ({
            id: randomUUID(),
            projectId: id,
            userId: c.id,
          })),
        );
    }
    if (tags.length > 0) {
      // Reference values come from the validated vocabulary, never arbitrary input.
      await tx
        .insert(tag)
        .values(
          tags.map((id) => ({
            id,
            name: TAG_LABEL[id as keyof typeof TAG_LABEL],
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(projectTag)
        .values(
          tags.map((tagId) => ({ id: randomUUID(), projectId: id, tagId })),
        );
    }

    if (draft) return { ok: true, draftId: id };
    return {
      ok: true,
      receipt: {
        title,
        collaborators: collaborators.map((c) => c.name),
        media: 1 + media.length,
      },
    };
  });
}
