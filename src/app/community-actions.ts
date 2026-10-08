"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  collaborationRequest,
  collaborationRequestReport,
  follow,
  project,
  showcaseCollection,
  showcaseCollectionProject,
} from "@/db/schema";

async function signedIn() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sign in to do that.");
  return session.user;
}

export async function setFollowing(
  target: { makerId?: string; projectId?: string },
  following: boolean,
) {
  const user = await signedIn();
  if (!!target.makerId === !!target.projectId || target.makerId === user.id)
    return;
  const condition = target.makerId
    ? and(eq(follow.userId, user.id), eq(follow.makerId, target.makerId))
    : and(eq(follow.userId, user.id), eq(follow.projectId, target.projectId!));
  if (following) {
    await db
      .insert(follow)
      .values({ id: randomUUID(), userId: user.id, ...target })
      .onConflictDoNothing();
  } else {
    await db.delete(follow).where(condition);
  }
  revalidatePath("/following");
  revalidatePath("/account");
}

export async function setFollowMuted(id: string, muted: boolean) {
  const user = await signedIn();
  await db
    .update(follow)
    .set({ muted })
    .where(and(eq(follow.id, id), eq(follow.userId, user.id)));
  revalidatePath("/following");
}

export async function requestCollaboration(projectId: string, message: string) {
  const sender = await signedIn();
  const text = message.trim();
  if (text.length < 10 || text.length > 1000) return;
  const [target] = await db
    .select({
      ownerId: project.userId,
      open: project.openToCollaboration,
      status: project.status,
    })
    .from(project)
    .where(eq(project.id, projectId));
  if (
    !target?.open ||
    target.status !== "PUBLISHED" ||
    target.ownerId === sender.id
  )
    return;
  await db
    .insert(collaborationRequest)
    .values({
      id: randomUUID(),
      projectId,
      senderId: sender.id,
      message: text,
    })
    .onConflictDoNothing();
  revalidatePath(`/project/${projectId}`);
}

export async function closeCollaborationRequest(id: string) {
  const user = await signedIn();
  const [request] = await db
    .select({ ownerId: project.userId, projectId: project.id })
    .from(collaborationRequest)
    .innerJoin(project, eq(project.id, collaborationRequest.projectId))
    .where(and(eq(collaborationRequest.id, id), eq(project.userId, user.id)));
  if (!request) return;
  await db
    .update(collaborationRequest)
    .set({ status: "CLOSED" })
    .where(eq(collaborationRequest.id, id));
  revalidatePath("/account");
}

export async function reportCollaborationRequest(id: string) {
  const user = await signedIn();
  const [request] = await db
    .select({ id: collaborationRequest.id })
    .from(collaborationRequest)
    .innerJoin(project, eq(project.id, collaborationRequest.projectId))
    .where(
      and(
        eq(collaborationRequest.id, id),
        or(
          eq(collaborationRequest.senderId, user.id),
          eq(project.userId, user.id),
        ),
      ),
    );
  if (!request) return;
  await db
    .insert(collaborationRequestReport)
    .values({
      requestId: id,
      reportedBy: user.id,
      reason: "Reported by a project participant",
    })
    .onConflictDoNothing();
}

export async function dismissCollaborationRequestReport(requestId: string) {
  const user = await signedIn();
  if (!["REVIEWER", "ADMIN"].includes(user.role ?? "")) return;
  await db
    .delete(collaborationRequestReport)
    .where(eq(collaborationRequestReport.requestId, requestId));
  revalidatePath("/review");
}

export async function createCollection(formData: FormData) {
  const user = await signedIn();
  if (!["REVIEWER", "ADMIN"].includes(user.role ?? "")) return;
  const title = String(formData.get("title") ?? "")
    .trim()
    .slice(0, 100);
  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 500);
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!title || !description || !slug) return;
  const collectionId = randomUUID();
  await db.insert(showcaseCollection).values({
    id: collectionId,
    slug,
    title,
    description,
    createdBy: user.id,
    published: true,
  });
  const ids = [...new Set(formData.getAll("projectId").map(String))];
  if (ids.length) {
    const published = await db
      .select({ id: project.id })
      .from(project)
      .where(and(inArray(project.id, ids), eq(project.status, "PUBLISHED")));
    const ordered = published
      .map(({ id }, index) => {
        const submitted = formData.get(`position:${id}`);
        return {
          id,
          position:
            submitted === null || submitted === ""
              ? index
              : Math.max(0, Number.parseInt(String(submitted), 10) || 0),
        };
      })
      .sort((a, b) => a.position - b.position);
    await db.insert(showcaseCollectionProject).values(
      ordered.map(({ id: projectId, position }) => ({
        id: randomUUID(),
        collectionId,
        projectId,
        position,
      })),
    );
  }
  revalidatePath("/collections");
}
