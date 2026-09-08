import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { bookmark, click, comment, like, project, user, view } from "@/db/schema";
import type { Actor } from "@/lib/actor";
import type { ProjectType } from "@/lib/departments";
import { engagementScore, type Interactions } from "@/lib/gauge";

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
  releaseAt: Date;
  createdAt: Date;
} & Interactions;

export const LAST_MONTH_LABEL = "Last month";

const projectColumns = {
  id: project.id,
  ownerId: project.userId,
  title: project.title,
  summary: project.summary,
  // The maker's own department, set at registration. Coalesced so every
  // display site can keep treating it as a plain string.
  department: sql<string>`coalesce(${user.department}, 'Unfiled')`,
  type: project.type,
  tags: project.tags,
  url: project.url,
  cover: project.cover,
  media: project.media,
  draft: project.draft,
  releaseAt: project.releaseAt,
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
  tags: string[];
  url: string;
  cover: string | null;
  media: string[];
  draft: boolean;
  releaseAt: Date;
  createdAt: Date;
  by: string;
};

type EventTable = typeof view | typeof click | typeof like | typeof comment;

// Grouped count across every project in one query — used for list pages.
async function countsByProject(table: EventTable) {
  const rows = await db
    .select({ projectId: table.projectId, count: count() })
    .from(table as PgTable)
    .groupBy(table.projectId);
  return new Map(rows.map((r) => [r.projectId, Number(r.count)]));
}

// Single-project count — cheaper than the grouped query when there's only one id.
async function countFor(table: EventTable, projectId: string) {
  const rows = await db
    .select({ count: count() })
    .from(table as PgTable)
    .where(eq(table.projectId, projectId));
  return Number(rows[0]?.count ?? 0);
}

async function attachCounts(rows: ProjectRow[]): Promise<Project[]> {
  const [views, clicks, likes, comments] = await Promise.all([
    countsByProject(view),
    countsByProject(click),
    countsByProject(like),
    countsByProject(comment),
  ]);
  return rows.map((r) => ({
    ...r,
    type: r.type as ProjectType,
    views: views.get(r.id) ?? 0,
    clicks: clicks.get(r.id) ?? 0,
    likes: likes.get(r.id) ?? 0,
    comments: comments.get(r.id) ?? 0,
  }));
}

// Every public read goes through this: drafts belong to their owner only, and
// a scheduled project stays hidden until its release time has passed. Called
// per query so `now` is the request's, not the module's.
const published = () =>
  and(eq(project.draft, false), lte(project.releaseAt, new Date()));

export async function getAllProjects(): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(published());
  return attachCounts(rows);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(and(eq(project.id, id), published()));

  const row = rows[0];
  if (!row) return undefined;

  const [views, clicks, likes, comments] = await Promise.all([
    countFor(view, id),
    countFor(click, id),
    countFor(like, id),
    countFor(comment, id),
  ]);

  return { ...row, type: row.type as ProjectType, views, clicks, likes, comments };
}

export async function getTopThreeProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  return projects
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, 3);
}

// Owner first, then whoever they credited. Used by the project page to link
// each maker to their profile.
export async function getProjectMakers(projectId: string) {
  const rows = await db
    .select({ userId: project.userId, collaborators: project.collaborators })
    .from(project)
    .where(eq(project.id, projectId));
  const row = rows[0];
  if (!row) return [];

  const ids = [row.userId, ...row.collaborators.filter((id) => id !== row.userId)];
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
  return attachCounts(rows);
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

export async function getProjectsByUser(userId: string): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(eq(project.userId, userId));
  return attachCounts(rows);
}

export async function getLikedProjects(userId: string): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .innerJoin(like, eq(like.projectId, project.id))
    .where(and(eq(like.userId, userId), published()))
    .orderBy(desc(like.createdAt));
  return attachCounts(rows);
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

  const [views, clicks, likes, comments] = await Promise.all([
    countsByProject(view),
    countsByProject(click),
    countsByProject(like),
    countsByProject(comment),
  ]);

  const byMaker = new Map<string, Maker>();
  for (const r of rows) {
    const signal = engagementScore({
      views: views.get(r.projectId) ?? 0,
      clicks: clicks.get(r.projectId) ?? 0,
      likes: likes.get(r.projectId) ?? 0,
      comments: comments.get(r.projectId) ?? 0,
    });
    const maker = byMaker.get(r.userId) ?? {
      userId: r.userId,
      name: r.name,
      department: r.department,
      projects: 0,
      signal: 0,
    };
    maker.projects += 1;
    maker.signal += signal;
    byMaker.set(r.userId, maker);
  }

  return [...byMaker.values()]
    .sort((a, b) => b.signal - a.signal)
    .slice(0, limit);
}

export async function getLikedProjectIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ projectId: like.projectId })
    .from(like)
    .where(eq(like.userId, userId));
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
  return attachCounts(rows);
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
  return rows[0];
}

export type ProjectComment = { id: string; body: string; createdAt: Date; by: string };

export async function getCommentsForProject(projectId: string): Promise<ProjectComment[]> {
  return db
    .select({ id: comment.id, body: comment.body, createdAt: comment.createdAt, by: user.name })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(eq(comment.projectId, projectId))
    .orderBy(desc(comment.createdAt));
}

// Takes an already-resolved actor so the caller can defer this with `after()`
// without touching request APIs inside the callback.
export async function recordView(projectId: string, actor: Actor) {
  await db
    .insert(view)
    .values({ id: randomUUID(), projectId, userId: actor.userId, actorKey: actor.key })
    .onConflictDoNothing();
}
