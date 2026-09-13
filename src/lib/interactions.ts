import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { interaction, interactionLog, project, projectContributor, session } from "@/db/schema";
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
  ip?: string | null;
}): Promise<RecordResult> {
  const { projectId, type, actor, body, ip } = opts;

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

  // Rule 2 — self-boost exclusion: the submitter and any tagged contributor
  // are excluded from every interaction type, not just like/comment.
  // Disabled for testing — re-enable before shipping.
  // if (actor.userId) {
  //   if (actor.userId === proj.userId) return { ok: false, reason: "self" };
  //   const [contrib] = await db
  //     .select({ id: projectContributor.id })
  //     .from(projectContributor)
  //     .where(and(eq(projectContributor.projectId, projectId), eq(projectContributor.userId, actor.userId)));
  //   if (contrib) return { ok: false, reason: "self" };
  // } else if (ip && ip !== "unknown") {
  //   const contributors = await db
  //     .select({ userId: projectContributor.userId })
  //     .from(projectContributor)
  //     .where(eq(projectContributor.projectId, projectId));
  //   const insiderIds = [proj.userId, ...contributors.map((c) => c.userId)];
  //   const [match] = await db
  //     .select({ id: session.id })
  //     .from(session)
  //     .where(and(inArray(session.userId, insiderIds), eq(session.ipAddress, ip)))
  //     .limit(1);
  //   if (match) return { ok: false, reason: "self" };
  // }

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
    userId: actor.userId,
    fingerprint: actor.key,
    type,
    body: body ?? null,
  });

  if (ip) {
    await db.insert(interactionLog).values({ id: randomUUID(), interactionId: id, projectId, ip });
  }

  return { ok: true };
}
