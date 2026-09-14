import {
  pgTable,
  pgEnum,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  integer,
  doublePrecision,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { SUMMARY_MAX, TITLE_MAX } from "@/lib/limits";

export const roleEnum = pgEnum("role", ["USER", "REVIEWER", "ADMIN"]);

export const department = pgTable("department", {
  id: text("id").primaryKey(),
});

// better-auth core tables — field names match @better-auth/core's schema
// (user/session/account/verification), required by the drizzle adapter.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Public handle used in profile URLs. Generated at sign-up (see
  // src/lib/username.ts); nullable so accounts created before it existed still
  // work — those fall back to their id in links.
  username: text("username").unique(),
  // Free text, shown on the public profile. Nullable: nobody is made to write one.
  bio: text("bio"),
  // Collected at sign-up. Nullable: Google sign-ins never pass through that form.
  department: text("department").references(() => department.id),
  level: text("level"),
  // Granted by hand via `db:studio`; there's no self-serve path to become a
  // REVIEWER or ADMIN.
  role: roleEnum("role").notNull().default("USER"),
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

export const project = pgTable("project", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

  title: varchar("title", { length: TITLE_MAX }).notNull(),
  summary: varchar("summary", { length: SUMMARY_MAX }).notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  cover: text("cover"),
  media: jsonb("media").$type<string[]>().notNull().default([]),
  draft: boolean("draft").notNull().default(false),
  department: text("department").references(() => department.id),
  status: text("status").notNull().default("PENDING"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reference table for tags — id is the existing slug (e.g. "ai"), name is
// the display label (matches TAG_LABEL in src/lib/tags.ts, which remains the
// source of truth for the vocabulary and its labels).
export const tag = pgTable("tag", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

// Many-to-many: a project can carry up to MAX_TAGS of these. Replaces the
// old project.tags jsonb array so tags are a real relationship, not a
// denormalized blob — a tag can be renamed or looked up from either side.
export const projectTag = pgTable(
  "project_tag",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => tag.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("project_tag_project_tag_idx").on(t.projectId, t.tagId)],
);

export const projectContributor = pgTable(
  "project_contributor",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("project_contributor_project_user_idx").on(t.projectId, t.userId)],
);

export const interaction = pgTable(
  "interaction",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    type: text("type").notNull(),
    body: text("body"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("interaction_like_unique_idx")
      .on(t.projectId, t.userId, t.type)
      .where(sql`${t.type} = 'like'`),
    index("interaction_dedupe_idx").on(t.projectId, t.fingerprint, t.type, t.createdAt),
  ],
);

// Raw IP per interaction, kept out of `interaction` so the table that backs
// public aggregate counts never carries PII. Feeds the abuse-flag query only.
export const interactionLog = pgTable("interaction_log", {
  id: text("id").primaryKey(),
  interactionId: text("interaction_id").notNull().references(() => interaction.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  ip: text("ip").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Moderated comments. A hidden comment stops counting toward the comment
// score — the scoring query excludes any interaction with a row here — but
// stays in `interaction` so nothing is actually deleted.
export const hiddenComment = pgTable("hidden_comment", {
  interactionId: text("interaction_id").primaryKey().references(() => interaction.id, { onDelete: "cascade" }),
  hiddenAt: timestamp("hidden_at").notNull().defaultNow(),
  hiddenBy: text("hidden_by").notNull().references(() => user.id),
});

// Materialized nightly by the batch job in src/lib/signal-scores.ts — never
// computed live. One row per project, always reflecting its most recently
// computed cohort; once a project's cohort month ends, nightly runs stop
// touching its row, so past scores stay frozen rather than recomputed
// forever.
export const signalScore = pgTable(
  "signal_score",
  {
    projectId: text("project_id").primaryKey().references(() => project.id, { onDelete: "cascade" }),
    cohortMonth: text("cohort_month").notNull(),
    signalScore: doublePrecision("signal_score").notNull(),
    computedAt: timestamp("computed_at").notNull().defaultNow(),
  },
  (t) => [index("signal_score_cohort_idx").on(t.cohortMonth)],
);

export const rankingOverride = pgTable("ranking_override", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  cohortMonth: text("cohort_month").notNull(),
  action: text("action").notNull(),
  reason: text("reason").notNull(),
  actedBy: text("acted_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Nightly IP-velocity scan over interaction_log, upserted here so a
// reviewer's "reviewed" dismissal survives the next night's re-run. A flag is
// a prompt for human review, never an automatic block.
export const abuseFlag = pgTable(
  "abuse_flag",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
    ip: text("ip").notNull(),
    day: text("day").notNull(),
    count: integer("count").notNull(),
    reviewed: boolean("reviewed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("abuse_flag_project_ip_day_idx").on(t.projectId, t.ip, t.day)],
);

export const bookmark = pgTable("bookmark", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("bookmark_project_user_idx").on(t.projectId, t.userId),
]);
