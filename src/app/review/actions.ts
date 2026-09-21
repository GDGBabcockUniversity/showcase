"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { project, rankingOverride } from "@/db/schema";
import { requireRole } from "@/lib/require-role";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/project-status";
import { cohortMonthOf } from "@/lib/signal-scores";

export type ReviewState = { ok: boolean; error?: string };

export async function setProjectStatus(
  projectId: string,
  status: string,
): Promise<ReviewState> {
  await requireRole("REVIEWER");

  if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "Not a real status." };
  }

  const [current] = await db.select({ status: project.status }).from(project).where(eq(project.id, projectId));
  if (!current) return { ok: false, error: "That project doesn't exist." };

  const next = status as ProjectStatus;
  // Set once, on the transition into PUBLISHED — never touched again, so a
  // later re-review can't move the project's cohort month.
  const publishedAt = current.status !== "PUBLISHED" && next === "PUBLISHED" ? new Date() : undefined;

  await db
    .update(project)
    .set({ status: next, ...(publishedAt ? { publishedAt } : {}) })
    .where(eq(project.id, projectId));

  revalidatePath("/review");
  revalidatePath("/", "layout");
  return { ok: true };
}

// Lead-only. Logs the override rather than silently re-ranking — the
// next-highest project is promoted simply because getTopThreeProjects()
// filters this project out of the current cohort's ranking.
export async function demoteProject(projectId: string, reason: string): Promise<ReviewState> {
  const session = await requireRole("ADMIN");

  if (reason.trim().length < 5) {
    return { ok: false, error: "Say why, briefly." };
  }

  await db.insert(rankingOverride).values({
    id: randomUUID(),
    projectId,
    cohortMonth: cohortMonthOf(new Date()),
    action: "DEMOTE",
    reason: reason.trim(),
    actedBy: session.user.id,
  });

  revalidatePath("/review");
  revalidatePath("/this-month");
  return { ok: true };
}
