import { endOfMonth, format, startOfMonth } from "date-fns";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
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

export function cohortMonthOf(date: Date): string {
  return format(date, "yyyy-MM");
}

export function cohortBounds(cohortMonth: string): { start: Date; end: Date } {
  const start = startOfMonth(new Date(`${cohortMonth}-01T00:00:00`));
  const end = endOfMonth(start);
  return { start, end };
}

// Nearest-rank percentile — simple and defensible for v1 over interpolation.
export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const rank = Math.ceil(p * sortedAsc.length) - 1;
  return sortedAsc[Math.min(Math.max(rank, 0), sortedAsc.length - 1)];
}

// Normalizes a metric's raw counts against the cohort's p90 (>=10 published
// projects that month) or median otherwise, capped at 1.0. When the
// benchmark itself is 0 (the typical project got none of this metric), a
// project with an actual nonzero count still gets full credit rather than
// being divided by zero and erased — dividing by zero, not the absence of
// a benchmark, is the only case that should force everyone to 0.
export function normalizeMetric(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const benchmark =
    values.length >= MIN_COHORT_FOR_P90 ? percentile(sorted, 0.9) : percentile(sorted, 0.5);
  if (benchmark <= 0) return values.map((v) => (v > 0 ? 1 : 0));
  return values.map((v) => Math.min(1, v / benchmark));
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
export async function firstCommentCounts(projectIds: string[]): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map();
  const result = await db.execute<{ project_id: string; n: string }>(sql`
    SELECT project_id, count(*) AS n
    FROM (
      SELECT DISTINCT ON (i.project_id, i.user_id) i.project_id, i.user_id
      FROM ${interaction} i
      LEFT JOIN hidden_comment h ON h.interaction_id = i.id
      WHERE i.type = 'comment'
        AND h.interaction_id IS NULL
        AND i.project_id IN (${sql.join(projectIds.map((id) => sql`${id}`), sql`, `)})
      ORDER BY i.project_id, i.user_id, i.created_at ASC
    ) first_comments
    GROUP BY project_id
  `);
  return new Map(result.rows.map((r) => [r.project_id, Number(r.n)]));
}

// Raw view/click/like counts for every PUBLISHED project whose publishedAt
// falls in the given cohort month, counted over [publishedAt, cohort end) —
// the spec's "interaction window per project."
export async function cohortRawCounts(cohortMonth: string): Promise<CohortRawCounts[]> {
  const { start, end } = cohortBounds(cohortMonth);

  const projects = await db
    .select({ id: project.id, publishedAt: project.publishedAt })
    .from(project)
    .where(and(eq(project.status, "PUBLISHED"), gte(project.publishedAt, start), lt(project.publishedAt, end)));

  if (projects.length === 0) return [];

  // Joined back to `project` rather than filtered by a single static bound,
  // since the window's lower edge (published_at) differs per project — "from
  // publication through the end of the cohort month," not just "sometime in
  // the cohort month."
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
        inArray(interaction.projectId, projects.map((p) => p.id)),
        inArray(interaction.type, ["view", "click", "like"]),
        gte(interaction.createdAt, project.publishedAt),
        lt(interaction.createdAt, end),
      ),
    )
    .groupBy(interaction.projectId, interaction.type);

  const byProject = new Map<string, { views: number; clicks: number; likes: number }>();
  for (const p of projects) byProject.set(p.id, { views: 0, clicks: 0, likes: 0 });
  for (const c of counts) {
    const row = byProject.get(c.projectId);
    if (!row) continue;
    if (c.type === "view") row.views = Number(c.n);
    if (c.type === "click") row.clicks = Number(c.n);
    if (c.type === "like") row.likes = Number(c.n);
  }

  const comments = await firstCommentCounts(projects.map((p) => p.id));

  return projects.map((p) => ({
    projectId: p.id,
    ...byProject.get(p.id)!,
    comments: comments.get(p.id) ?? 0,
  }));
}

export type ComputedScore = { projectId: string; cohortMonth: string; score: number };

// Percentile-normalize each metric across the cohort, weight, and sum — the
// core of the nightly batch job. Pure computation, no writes, so it's
// testable without a database.
export function computeScores(cohortMonth: string, raw: CohortRawCounts[]): ComputedScore[] {
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

// The nightly entry point: compute the current cohort month's scores and
// upsert them. Only ever touches the current month's rows — once a cohort
// ends, its projects' signal_score rows simply stop being updated, a frozen
// snapshot rather than a live recompute across all history.
export async function runNightlySignalScoring(now = new Date()): Promise<ComputedScore[]> {
  const cohortMonth = cohortMonthOf(now);
  const raw = await cohortRawCounts(cohortMonth);
  const scores = computeScores(cohortMonth, raw);

  for (const s of scores) {
    await db
      .insert(signalScore)
      .values({ projectId: s.projectId, cohortMonth: s.cohortMonth, signalScore: s.score, computedAt: now })
      .onConflictDoUpdate({
        target: signalScore.projectId,
        set: { cohortMonth: s.cohortMonth, signalScore: s.score, computedAt: now },
      });
  }

  return scores;
}
