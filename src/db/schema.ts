import { pgTable, text, varchar, timestamp, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { SUMMARY_MAX, TITLE_MAX } from "@/lib/limits";

// better-auth core tables — field names match @better-auth/core's schema
// (user/session/account/verification), required by the drizzle adapter.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Collected at sign-up. Nullable: Google sign-ins never pass through that form.
  department: text("department"),
  level: text("level"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// App-level table for real submissions — backs the feed/home/this-month pages.
export const project = pgTable("project", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  // lengths mirror src/lib/limits.ts — the last line of defence if a write
  // ever reaches the table without going through the submit form
  title: varchar("title", { length: TITLE_MAX }).notNull(),
  summary: varchar("summary", { length: SUMMARY_MAX }).notNull(),
  department: text("department").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  collaborators: jsonb("collaborators").$type<string[]>().notNull().default([]),
  cover: text("cover"),
  media: jsonb("media").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// views/clicks/likes/comments are each an event log, not a counter — counts are
// computed on the fly (COUNT(*) grouped by project) so there's nothing to keep in sync.
//
// actorKey identifies who interacted: the account id when signed in, otherwise a
// hash of IP + user agent (see src/lib/actor.ts). The unique index on
// (project, actor) is what makes these count unique people, not page loads.
export const view = pgTable("view", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  actorKey: text("actor_key").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("view_project_actor_idx").on(t.projectId, t.actorKey),
]);

export const click = pgTable("click", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  actorKey: text("actor_key").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("click_project_actor_idx").on(t.projectId, t.actorKey),
]);

// One like per (project, user) — the unique index is what makes toggling idempotent.
export const like = pgTable("like", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("like_project_user_idx").on(t.projectId, t.userId),
]);

// One bookmark per (project, user), same shape as like — this is a private
// save-for-later list rather than a public signal, so it feeds no scoring.
export const bookmark = pgTable("bookmark", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("bookmark_project_user_idx").on(t.projectId, t.userId),
]);

export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
