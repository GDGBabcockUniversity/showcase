import { randomUUID } from "node:crypto";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  interaction,
  interactionLog,
  project,
  projectContributor,
} from "@/db/schema";
import type { Actor } from "@/lib/actor";
import type { InteractionType } from "@/lib/interaction-types";

const DAY_MS = 24 * 60 * 60 * 1000;

export type RecordResult =
  | { ok: true; deduped?: boolean }
  | { ok: false; reason: "signin-required" | "self" | "not-found" };

// Every write to `interaction` goes through here so the four anti-gaming
// rules live in one place instead of being re-implemented per call site.
export async function recordInteraction(opts: {
  projectId: string;
  type: InteractionType;
  actor: Actor;
  body?: string;
  parentId?: string | null;
  ip?: string | null;
}): Promise<RecordResult> {
  const { projectId, type, actor, body, parentId, ip } = opts;

  // Rule 1 — like/comment require a signed-in user. requireSession() in
  // src/app/actions.ts is the primary UX gate; this is the hard backstop.
  if ((type === "like" || type === "comment") && !actor.userId) {
    return { ok: false, reason: "signin-required" };
  }

  const [proj] = await db
    .select({ userId: project.userId })
    .from(project)
    .where(eq(project.id, projectId));
  if (!proj) return { ok: false, reason: "not-found" };

  // Exclude signed-in owners and contributors from every signal-driving
  // interaction. IP matching is deliberately avoided because campus NATs
  // can include many unrelated users.
  if (actor.userId) {
    if (actor.userId === proj.userId) return { ok: false, reason: "self" };
    const [contributor] = await db
      .select({ id: projectContributor.id })
      .from(projectContributor)
      .where(
        and(
          eq(projectContributor.projectId, projectId),
          eq(projectContributor.userId, actor.userId),
        ),
      )
      .limit(1);
    if (contributor) return { ok: false, reason: "self" };
  }

  // Rule 4 — like toggling is handled by the caller (select-then-delete vs
  // insert); by the time we get here for a like it's always an insert, and
  // the partial unique index on (project, user, type='like') backs it up.

  if (type === "view" || type === "click") {
    // Rule 3 — 24h rolling dedupe. Not expressible as a plain unique index
    // (no time-window predicate in a btree), so it's a query-then-insert
    // check instead. Not race-proof under true simultaneous requests from
    // the same actor within the same instant — an accepted tradeoff at this
    // traffic scale, not worth a pg_advisory_lock.
    const since = new Date(Date.now() - DAY_MS);
    const [dup] = await db
      .select({ id: interaction.id })
      .from(interaction)
      .where(
        and(
          eq(interaction.projectId, projectId),
          eq(interaction.fingerprint, actor.key),
          eq(interaction.type, type),
          gte(interaction.createdAt, since),
        ),
      )
      .limit(1);
    if (dup) return { ok: true, deduped: true };
  }

  const id = randomUUID();
  await db.insert(interaction).values({
    id,
    projectId,
    parentId: parentId ?? null,
    userId: actor.userId,
    fingerprint: actor.key,
    type,
    body: body ?? null,
  });

  if (ip) {
    await db
      .insert(interactionLog)
      .values({ id: randomUUID(), interactionId: id, projectId, ip });
  }

  return { ok: true };
}
