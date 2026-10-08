"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  collaborationRequest,
  collaborationRequestReport,
  project,
} from "@/db/schema";

async function signedIn() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sign in to do that.");
  return session.user;
}

export type CollaborationRequestState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function requestCollaboration(
  projectId: string,
  _previous: CollaborationRequestState,
  formData: FormData,
): Promise<CollaborationRequestState> {
  const sender = await signedIn();
  const text = String(formData.get("message") ?? "").trim();
  if (text.length < 10 || text.length > 1000) {
    return {
      status: "error",
      message: "Write between 10 and 1,000 characters.",
    };
  }
  const [target] = await db
    .select({
      ownerId: project.userId,
      open: project.openToCollaboration,
      status: project.status,
    })
    .from(project)
    .where(eq(project.id, projectId));
  if (!target?.open || target.status !== "PUBLISHED") {
    return {
      status: "error",
      message: "This project is no longer accepting requests.",
    };
  }
  if (target.ownerId === sender.id) {
    return {
      status: "error",
      message: "You can’t request to join your own project.",
    };
  }
  const [created] = await db
    .insert(collaborationRequest)
    .values({
      id: randomUUID(),
      projectId,
      senderId: sender.id,
      message: text,
    })
    .onConflictDoNothing()
    .returning({ id: collaborationRequest.id });
  if (!created) {
    return {
      status: "error",
      message: "You already have an open request for this project.",
    };
  }
  revalidatePath(`/project/${projectId}`);
  revalidatePath("/account");
  return {
    status: "success",
    message: "Request sent. The maker can review it from their account.",
  };
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
  revalidatePath("/account");
}

export async function dismissCollaborationRequestReport(requestId: string) {
  const user = await signedIn();
  if (!["REVIEWER", "ADMIN"].includes(user.role ?? "")) return;
  await db
    .delete(collaborationRequestReport)
    .where(eq(collaborationRequestReport.requestId, requestId));
  revalidatePath("/review");
}
