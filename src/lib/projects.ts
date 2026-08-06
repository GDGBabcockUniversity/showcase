import { randomUUID } from "node:crypto";
import { count, desc, eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { click, comment, like, project, user, view } from "@/db/schema";
import { actorKey } from "@/lib/actor";
import type { ProjectType } from "@/lib/departments";
import { engagementScore, type Interactions } from "@/lib/gauge";

export type Project = {
  id: string;
  title: string;
  summary: string;
  by: string;
  department: string;
  type: ProjectType;
  url: string;
} & Interactions;

export const LAST_MONTH_LABEL = "Last month";

const projectColumns = {
  id: project.id,
  title: project.title,
  summary: project.summary,
  department: project.department,
  type: project.type,
  url: project.url,
  by: user.name,
};

type ProjectRow = {
  id: string;
  title: string;
  summary: string;
  department: string;
  type: string;
  url: string;
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

export async function getAllProjects(): Promise<Project[]> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id));
  return attachCounts(rows);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const rows = await db
    .select(projectColumns)
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(eq(project.id, id));

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

export async function getLikedProjectIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ projectId: like.projectId })
    .from(like)
    .where(eq(like.userId, userId));
  return new Set(rows.map((r) => r.projectId));
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

export async function recordView(projectId: string) {
  const { key, userId } = await actorKey();
  await db
    .insert(view)
    .values({ id: randomUUID(), projectId, userId, actorKey: key })
    .onConflictDoNothing();
}
