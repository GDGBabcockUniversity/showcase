import { and, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookmark,
  hiddenComment,
  interaction,
  project,
  projectContributor,
  projectTag,
  rankingOverride,
  signalScore,
  user,
} from "@/db/schema";
import type { Actor } from "@/lib/actor";
import type { ProjectType } from "@/lib/departments";
import type { Interactions, InteractionType } from "@/lib/interaction-types";
import type { ProjectStatus } from "@/lib/project-status";
import { recordInteraction } from "@/lib/interactions";
import { cohortBounds, cohortMonthOf, firstCommentCounts } from "@/lib/signal-scores";

export type Project = {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  by: string;
  department: string;
  type: ProjectType;
  tags: string[];
  url: string;
  cover: string | null;
  media: string[];
  draft: boolean;
  status: ProjectStatus;
  publishedAt: Date | null;
  createdAt: Date;
  signalScore: number;
} & Interactions;

export const THIS_MONTH_LABEL = "This month";

const projectColumns = {
  id: project.id,
  ownerId: project.userId,
  title: project.title,
  summary: project.summary,
  // Denormalized from the submitter's department at submit time. Coalesced
  // so every display site can keep treating it as a plain string.
  department: sql<string>`coalesce(${project.department}, 'Unfiled')`,
  type: project.type,
  url: project.url,
  cover: project.cover,
  media: project.media,
  draft: project.draft,
  status: project.status,
  publishedAt: project.publishedAt,
  createdAt: project.createdAt,
  by: user.name,
};

type ProjectRow = {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  department: string;
  type: string;
  url: string;
  cover: string | null;
  media: string[];
  draft: boolean;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  by: string;
};

// Grouped count across every project in one query — used for list pages.
async function countsByProject(type: InteractionType) {
  const rows = await db
    .select({ projectId: interaction.projectId, count: count() })
    .from(interaction)
    .where(eq(interaction.type, type))
    .groupBy(interaction.projectId);
  return new Map(rows.map((r) => [r.projectId, Number(r.count)]));
}

// Single-project count — cheaper than the grouped query when there's only one id.
async function countFor(type: InteractionType, projectId: string) {
  const rows = await db
    .select({ count: count() })
    .from(interaction)
    .where(and(eq(interaction.type, type), eq(interaction.projectId, projectId)));
  return Number(rows[0]?.count ?? 0);
}

// Grouped tag ids across every project in one query — mirrors countsByProject.
async function tagsByProject() {
  const rows = await db.select({ projectId: projectTag.projectId, tagId: projectTag.tagId }).from(projectTag);
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const list = map.get(r.projectId) ?? [];
    list.push(r.tagId);
    map.set(r.projectId, list);
  }
  return map;
}

// Single-project tag ids — cheaper than the grouped query for one id.
async function tagsFor(projectId: string): Promise<string[]> {
  const rows = await db.select({ tagId: projectTag.tagId }).from(projectTag).where(eq(projectTag.projectId, projectId));
  return rows.map((r) => r.tagId);
}

// signal_score has at most one row per project (materialized nightly) — a
// project that hasn't had a batch run yet simply shows 0, same as a project
// with genuinely no signal.
async function allSignalScores() {
  const rows = await db.select({ projectId: signalScore.projectId, score: signalScore.signalScore }).from(signalScore);
  return new Map(rows.map((r) => [r.projectId, r.score]));
}

async function signalScoreFor(projectId: string): Promise<number> {
  const [row] = await db
    .select({ score: signalScore.signalScore })
    .from(signalScore)
    .where(eq(signalScore.projectId, projectId));
  return row?.score ?? 0;
}

async function attachSignal(rows: ProjectRow[]): Promise<Project[]> {
  const [views, clicks, likes, comments, scores, tags] = await Promise.all([
    countsByProject("view"),
    countsByProject("click"),
    countsByProject("like"),
    countsByProject("comment"),
    allSignalScores(),
    tagsByProject(),
  ]);
  return rows.map((r) => ({
    ...r,
    type: r.type as ProjectType,
    status: r.status as ProjectStatus,
    views: views.get(r.id) ?? 0,
    clicks: clicks.get(r.id) ?? 0,
    likes: likes.get(r.id) ?? 0,
    comments: comments.get(r.id) ?? 0,
    signalScore: scores.get(r.id) ?? 0,
    tags: tags.get(r.id) ?? [],
  }));
}

// Every public read goes through this: drafts and anything still in review
// belong to their owner only.
const published = () => and(eq(project.draft, false), eq(project.status, "PUBLISHED"));

export async function getAllProjects(): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(published());
  return attachSignal(rows);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(and(eq(project.id, id), published()));

  const row = rows[0];
  if (!row) return undefined;

  const [views, clicks, likes, comments, score, tags] = await Promise.all([
    countFor("view", id),
    countFor("click", id),
    countFor("like", id),
    countFor("comment", id),
    signalScoreFor(id),
    tagsFor(id),
  ]);

  return {
    ...row,
    type: row.type as ProjectType,
    status: row.status as ProjectStatus,
    views,
    clicks,
    likes,
    comments,
    signalScore: score,
    tags,
  };
}

// Ranked by the materialized signal_score for the current cohort month,
// tiebroken by comment count (post-moderation) then earliest publish date.
// Excludes anything a Technical Lead has demoted for this cohort — the
// next-highest is simply whatever lands in the top 3 once that row is gone.
export async function getTopThreeProjects(): Promise<Project[]> {
  const cohortMonth = cohortMonthOf(new Date());

  const rows = await db
    .select({ ...projectColumns, score: signalScore.signalScore })
    .from(signalScore)
    .innerJoin(project, eq(project.id, signalScore.projectId))
    .innerJoin(user, eq(project.userId, user.id))
    .where(eq(signalScore.cohortMonth, cohortMonth));

  if (rows.length === 0) return [];

  const demoted = await db
    .select({ projectId: rankingOverride.projectId })
    .from(rankingOverride)
    .where(and(eq(rankingOverride.cohortMonth, cohortMonth), eq(rankingOverride.action, "DEMOTE")));
  const demotedIds = new Set(demoted.map((d) => d.projectId));

  const eligible = rows.filter((r) => !demotedIds.has(r.id));
  const comments = await firstCommentCounts(eligible.map((r) => r.id));

  const orderedIds = eligible
    .map((r) => ({ id: r.id, score: r.score, commentCount: comments.get(r.id) ?? 0, publishedAt: r.publishedAt }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.commentCount - a.commentCount ||
        (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0),
    )
    .slice(0, 3)
    .map((r) => r.id);

  if (orderedIds.length === 0) return [];

  const topRows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(inArray(project.id, orderedIds));

  const byId = new Map(topRows.map((r) => [r.id, r]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((r): r is ProjectRow => !!r);

  return attachSignal(ordered);
}

// Backs /archive — every published project whose publishedAt falls in the
// given "YYYY-MM" cohort month, same bounds the scoring pipeline uses.
export async function getProjectsByCohortMonth(cohortMonth: string): Promise<Project[]> {
  const { start, end } = cohortBounds(cohortMonth);
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(and(eq(project.status, "PUBLISHED"), gte(project.publishedAt, start), lt(project.publishedAt, end)));
  return attachSignal(rows);
}

const ARCHIVE_PAGE_SIZE = 20;

export type ArchivePage = { projects: Project[]; nextCursor: string | null };

// Cursor-paginated browse of everything published before the current
// calendar month, newest first — backs the archive's infinite scroll when
// no specific month/year is picked. The cursor is the last row's
// publishedAt ISO string; each page fetches one extra row to know whether
// there's more without a separate count query.
export async function getArchivedProjectsPage(cursor?: string | null): Promise<ArchivePage> {
  const { start: currentMonthStart } = cohortBounds(cohortMonthOf(new Date()));
  const before = cursor ? new Date(cursor) : currentMonthStart;

  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(and(eq(project.status, "PUBLISHED"), lt(project.publishedAt, before)))
    .orderBy(desc(project.publishedAt))
    .limit(ARCHIVE_PAGE_SIZE + 1);

  const hasMore = rows.length > ARCHIVE_PAGE_SIZE;
  const page = rows.slice(0, ARCHIVE_PAGE_SIZE);
  const projects = await attachSignal(page);
  const last = page[page.length - 1];
  const nextCursor = hasMore && last?.publishedAt ? last.publishedAt.toISOString() : null;

  return { projects, nextCursor };
}

// Every cohort month that actually has a published project, newest first —
// powers the archive's "browse by month" shortcuts.
export async function getPublishedCohortMonths(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ month: sql<string>`to_char(${project.publishedAt}, 'YYYY-MM')` })
    .from(project)
    .where(and(eq(project.status, "PUBLISHED"), isNotNull(project.publishedAt)))
    .orderBy(desc(sql`to_char(${project.publishedAt}, 'YYYY-MM')`));
  return rows.map((r) => r.month);
}

// Owner first, then tagged contributors. Used by the project page to link
// each maker to their profile.
export async function getProjectMakers(projectId: string) {
  const [row] = await db
    .select({ userId: project.userId })
    .from(project)
    .where(eq(project.id, projectId));
  if (!row) return [];

  const contributors = await db
    .select({ userId: projectContributor.userId })
    .from(projectContributor)
    .where(eq(projectContributor.projectId, projectId));

  const ids = [row.userId, ...contributors.map((c) => c.userId).filter((id) => id !== row.userId)];
  const people = await db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      department: user.department,
    })
    .from(user)
    .where(inArray(user.id, ids));

  // Ordered by `ids` so the owner stays first whatever the database returns.
  return ids
    .map((id) => people.find((u) => u.id === id))
    .filter((u) => !!u)
    .map((u, i) => ({ ...u, owner: i === 0 }));
}

// A profile only shows what's actually on the board.
export async function getPublicProjectsByUser(userId: string): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(and(eq(project.userId, userId), published()));
  return attachSignal(rows);
}

export type Person = {
  id: string;
  username: string | null;
  name: string;
  image: string | null;
  department: string | null;
  projects: number;
};

// Public people search behind /feed?q=. Deliberately not searchUsers from
// actions.ts: that one is session-gated and excludes the caller, both wrong
// here. The left join carries published() so drafts and unreleased projects
// don't inflate the count.
export async function searchPeople(query: string): Promise<Person[]> {
  const q = query.trim();
  if (!q) return [];

  return db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      department: user.department,
      projects: count(project.id),
    })
    .from(user)
    .leftJoin(project, and(eq(project.userId, user.id), published()))
    .where(or(ilike(user.name, `%${q}%`), ilike(user.username, `%${q}%`)))
    .groupBy(user.id)
    .limit(6);
}

// Owner's own view of everything they've filed, whatever its status.
export async function getProjectsByUser(userId: string): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(eq(project.userId, userId));
  return attachSignal(rows);
}

export async function getLikedProjects(userId: string): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .innerJoin(interaction, and(eq(interaction.projectId, project.id), eq(interaction.type, "like")))
    .where(and(eq(interaction.userId, userId), published()))
    .orderBy(desc(interaction.createdAt));
  return attachSignal(rows);
}

export type Maker = {
  userId: string;
  name: string;
  department: string | null;
  projects: number;
  signal: number;
};

// Signal per maker for projects filed since the 1st of the current month, so
// the "this month" label on the home page is actually true. Keyed by user id
// rather than display name, and the department is the maker's own rather than
// whatever department their project was filed under.
export async function getTopMakers(limit = 5): Promise<Maker[]> {
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await db
    .select({
      projectId: project.id,
      userId: project.userId,
      name: user.name,
      department: user.department,
    })
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(and(gte(project.createdAt, since), published()));

  if (rows.length === 0) return [];

  const scores = await allSignalScores();

  const byMaker = new Map<string, Maker>();
  for (const r of rows) {
    const maker = byMaker.get(r.userId) ?? {
      userId: r.userId,
      name: r.name,
      department: r.department,
      projects: 0,
      signal: 0,
    };
    maker.projects += 1;
    maker.signal += scores.get(r.projectId) ?? 0;
    byMaker.set(r.userId, maker);
  }

  return [...byMaker.values()]
    .sort((a, b) => b.signal - a.signal)
    .slice(0, limit);
}

export async function getLikedProjectIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ projectId: interaction.projectId })
    .from(interaction)
    .where(and(eq(interaction.type, "like"), eq(interaction.userId, userId)));
  return new Set(rows.map((r) => r.projectId));
}

export async function getBookmarkedProjects(userId: string): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .innerJoin(bookmark, eq(bookmark.projectId, project.id))
    .where(and(eq(bookmark.userId, userId), published()))
    .orderBy(desc(bookmark.createdAt));
  return attachSignal(rows);
}

export async function getBookmarkedProjectIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ projectId: bookmark.projectId })
    .from(bookmark)
    .where(eq(bookmark.userId, userId));
  return new Set(rows.map((r) => r.projectId));
}

// Ownership check for edit/delete. Returns the row only when the caller owns it.
export async function getOwnedProject(id: string, userId: string) {
  const rows = await db
    .select()
    .from(project)
    .where(and(eq(project.id, id), eq(project.userId, userId)));
  const row = rows[0];
  if (!row) return undefined;
  return { ...row, tags: await tagsFor(id) };
}

export type ProjectComment = {
  id: string;
  body: string;
  createdAt: Date;
  by: string;
  image: string | null;
  username: string | null;
  userId: string;
};

// Hidden (moderated) comments are excluded here too — "hidden" means hidden
// from the public feed, not just from scoring.
export async function getCommentsForProject(projectId: string): Promise<ProjectComment[]> {
  return db
    .select({
      id: interaction.id,
      body: interaction.body,
      createdAt: interaction.createdAt,
      by: user.name,
      image: user.image,
      username: user.username,
      userId: user.id,
    })
    .from(interaction)
    .innerJoin(user, eq(interaction.userId, user.id))
    .leftJoin(hiddenComment, eq(hiddenComment.interactionId, interaction.id))
    .where(and(eq(interaction.projectId, projectId), eq(interaction.type, "comment"), isNull(hiddenComment.interactionId)))
    .orderBy(desc(interaction.createdAt))
    .then((rows) => rows.map((r) => ({ ...r, body: r.body ?? "" })));
}

// Takes an already-resolved actor (and raw IP) so the caller can defer this
// with `after()` without touching request APIs inside the callback.
export async function recordView(projectId: string, actor: Actor, ip?: string | null) {
  await recordInteraction({ projectId, type: "view", actor, ip });
}
