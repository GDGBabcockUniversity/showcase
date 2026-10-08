import { addMonths, format, startOfMonth } from "date-fns";
import { and, eq, gte, inArray, lt, sql, type SQLWrapper } from "drizzle-orm";
import { db } from "@/db";
import { interaction, project, signalScore } from "@/db/schema";

export const ENGAGEMENT_WEIGHTS = {
  views: 0.2,
  clicks: 0.4,
  likes: 0.25,
  comments: 0.15,
} as const;

// Cohorts smaller than this don't have enough projects for a reliable
// "what's a strong result" benchmark, so normalization falls back to the
// typical (median) project instead of the 90th percentile.
const MIN_COHORT_FOR_P90 = 10;

export function projectExposureEnd(publishedAt: Date, now: Date): Date {
  return new Date(
    Math.min(now.getTime(), cohortBounds(cohortMonthOf(publishedAt)).end.getTime()),
  );
}

export function cohortMonthOf(date: Date): string {
  return format(date, "yyyy-MM");
}

export function cohortBounds(cohortMonth: string): { start: Date; end: Date } {
  const start = startOfMonth(new Date(`${cohortMonth}-01T00:00:00`));
  const end = startOfMonth(addMonths(start, 1));
  return { start, end };
}

function excludeConfirmedAbuse(
  interactionId: SQLWrapper,
  projectId: SQLWrapper,
  createdAt: SQLWrapper,
) {
  return sql`NOT EXISTS (
    SELECT 1 FROM interaction_log il
    INNER JOIN abuse_flag af ON af.project_id = ${projectId}
      AND af.ip = il.ip
      AND af.day = to_char(${createdAt}, 'YYYY-MM-DD')
    WHERE il.interaction_id = ${interactionId}
      AND af.reviewed = true AND af.abusive = true
  )`;
}

function excludeProjectInsiders(
  userId: SQLWrapper,
  projectId: SQLWrapper,
  ownerId: SQLWrapper,
) {
  return sql`${userId} IS DISTINCT FROM ${ownerId}
    AND NOT EXISTS (
      SELECT 1 FROM project_contributor pc
      WHERE pc.project_id = ${projectId} AND pc.user_id = ${userId}
    )`;
}

// Nearest-rank percentile — simple and defensible for v1 over interpolation.
export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const rank = Math.ceil(p * sortedAsc.length) - 1;
  return sortedAsc[Math.min(Math.max(rank, 0), sortedAsc.length - 1)];
}

// Smooth diminishing returns against the cohort's p90 (>=10 projects) or
// median otherwise. Every positive value gets credit; no count plateaus.
export function normalizeMetric(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const benchmark =
    values.length >= MIN_COHORT_FOR_P90
      ? percentile(sorted, 0.9)
      : percentile(sorted, 0.5);
  const scale = Math.max(1, benchmark);
  return values.map((v) => (v <= 0 ? 0 : v / (v + scale)));
}

export type CohortRawCounts = {
  projectId: string;
  views: number;
  clicks: number;
  likes: number;
  comments: number;
};

// First-comment-per-user-per-project counts, moderated (hidden) comments
// excluded before the distinct — shared by the nightly batch job and the
// top-3 query so "only your first comment counts" means the same thing in
// both places.
export async function firstCommentCounts(
  projectIds: string[],
  now = new Date(),
): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map();
  const result = await db.execute<{ project_id: string; n: string }>(sql`
    SELECT project_id, count(*) AS n
    FROM (
      SELECT DISTINCT ON (i.project_id, i.user_id) i.project_id, i.user_id
      FROM ${interaction} i
      INNER JOIN ${project} p ON p.id = i.project_id
      LEFT JOIN hidden_comment h ON h.interaction_id = i.id
      WHERE i.type = 'comment'
        AND i.parent_id IS NULL
        AND h.interaction_id IS NULL
        AND ${excludeProjectInsiders(sql`i.user_id`, sql`i.project_id`, sql`p.user_id`)}
        AND i.created_at >= p.published_at
        AND i.created_at < LEAST(${now}, date_trunc('month', p.published_at) + interval '1 month')
        AND ${excludeConfirmedAbuse(sql`i.id`, sql`i.project_id`, sql`i.created_at`)}
        AND i.project_id IN (${sql.join(
          projectIds.map((id) => sql`${id}`),
          sql`, `,
        )})
      ORDER BY i.project_id, i.user_id, i.created_at ASC
    ) first_comments
    GROUP BY project_id
  `);
  return new Map(result.rows.map((r) => [r.project_id, Number(r.n)]));
}

// Raw counts for each published project in a month, from publication through
// the end of that calendar month.
export async function cohortRawCounts(
  cohortMonth: string,
  now = new Date(),
): Promise<CohortRawCounts[]> {
  const { start, end } = cohortBounds(cohortMonth);

  const projects = await db
    .select({ id: project.id, publishedAt: project.publishedAt })
    .from(project)
    .where(
      and(
        eq(project.status, "PUBLISHED"),
        gte(project.publishedAt, start),
        lt(project.publishedAt, end),
      ),
    );

  if (projects.length === 0) return [];

  // Each project's exposure end is the start of the following month.
  const counts = await db
    .select({
      projectId: interaction.projectId,
      type: interaction.type,
      n: sql<number>`count(*)`,
    })
    .from(interaction)
    .innerJoin(project, eq(project.id, interaction.projectId))
    .where(
      and(
        inArray(
          interaction.projectId,
          projects.map((p) => p.id),
        ),
        inArray(interaction.type, ["view", "click", "like"]),
        gte(interaction.createdAt, project.publishedAt),
        excludeProjectInsiders(
          interaction.userId,
          interaction.projectId,
          project.userId,
        ),
        sql`${interaction.createdAt} < LEAST(${now}, date_trunc('month', ${project.publishedAt}) + interval '1 month')`,
        excludeConfirmedAbuse(
          interaction.id,
          interaction.projectId,
          interaction.createdAt,
        ),
      ),
    )
    .groupBy(interaction.projectId, interaction.type);

  const byProject = new Map<
    string,
    { views: number; clicks: number; likes: number }
  >();
  for (const p of projects)
    byProject.set(p.id, { views: 0, clicks: 0, likes: 0 });
  for (const c of counts) {
    const row = byProject.get(c.projectId);
    if (!row) continue;
    if (c.type === "view") row.views = Number(c.n);
    if (c.type === "click") row.clicks = Number(c.n);
    if (c.type === "like") row.likes = Number(c.n);
  }

  const comments = await firstCommentCounts(
    projects.map((p) => p.id),
    now,
  );

  return projects.map((p) => ({
    projectId: p.id,
    ...byProject.get(p.id)!,
    comments: comments.get(p.id) ?? 0,
  }));
}

export type ComputedScore = {
  projectId: string;
  cohortMonth: string;
  score: number;
};

// Percentile-normalize each metric across the cohort, weight, and sum — the
// core of the nightly batch job. Pure computation, no writes, so it's
// testable without a database.
export function computeScores(
  cohortMonth: string,
  raw: CohortRawCounts[],
): ComputedScore[] {
  const views = normalizeMetric(raw.map((r) => r.views));
  const clicks = normalizeMetric(raw.map((r) => r.clicks));
  const likes = normalizeMetric(raw.map((r) => r.likes));
  const comments = normalizeMetric(raw.map((r) => r.comments));

  return raw.map((r, i) => ({
    projectId: r.projectId,
    cohortMonth,
    score:
      views[i] * ENGAGEMENT_WEIGHTS.views +
      clicks[i] * ENGAGEMENT_WEIGHTS.clicks +
      likes[i] * ENGAGEMENT_WEIGHTS.likes +
      comments[i] * ENGAGEMENT_WEIGHTS.comments,
  }));
}

export async function recomputeCohortSignalScores(
  cohortMonth: string,
  now = new Date(),
): Promise<ComputedScore[]> {
  const raw = await cohortRawCounts(cohortMonth, now);
  const scores = computeScores(cohortMonth, raw);

  for (const score of scores) {
    await db
      .insert(signalScore)
      .values({
        projectId: score.projectId,
        cohortMonth: score.cohortMonth,
        signalScore: score.score,
        computedAt: now,
      })
      .onConflictDoUpdate({
        target: signalScore.projectId,
        set: {
          cohortMonth: score.cohortMonth,
          signalScore: score.score,
          computedAt: now,
        },
      });
  }

  return scores;
}

// Recompute the current month's scores nightly. Once the month ends, its
// scores are final.
export async function runNightlySignalScoring(
  now = new Date(),
): Promise<ComputedScore[]> {
  const cohortMonth = cohortMonthOf(now);
  return recomputeCohortSignalScores(cohortMonth, now);
}
