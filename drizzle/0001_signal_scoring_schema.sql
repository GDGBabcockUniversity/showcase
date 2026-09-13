CREATE TABLE "abuse_flag" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"ip" text NOT NULL,
	"day" text NOT NULL,
	"count" integer NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "hidden_comment" (
	"interaction_id" text PRIMARY KEY NOT NULL,
	"hidden_at" timestamp DEFAULT now() NOT NULL,
	"hidden_by" text NOT NULL
);

--> statement-breakpoint
CREATE TABLE "interaction" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text,
	"fingerprint" text NOT NULL,
	"type" text NOT NULL,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "interaction_log" (
	"id" text PRIMARY KEY NOT NULL,
	"interaction_id" text NOT NULL,
	"project_id" text NOT NULL,
	"ip" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "project_contributor" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "ranking_override" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"cohort_month" text NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"acted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "signal_score" (
	"project_id" text PRIMARY KEY NOT NULL,
	"cohort_month" text NOT NULL,
	"signal_score" double precision NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "department" text;
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "status" text DEFAULT 'PENDING' NOT NULL;
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "published_at" timestamp;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;
--> statement-breakpoint
ALTER TABLE "abuse_flag" ADD CONSTRAINT "abuse_flag_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hidden_comment" ADD CONSTRAINT "hidden_comment_interaction_id_interaction_id_fk" FOREIGN KEY ("interaction_id") REFERENCES "public"."interaction"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hidden_comment" ADD CONSTRAINT "hidden_comment_hidden_by_user_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "interaction_log" ADD CONSTRAINT "interaction_log_interaction_id_interaction_id_fk" FOREIGN KEY ("interaction_id") REFERENCES "public"."interaction"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "interaction_log" ADD CONSTRAINT "interaction_log_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_contributor" ADD CONSTRAINT "project_contributor_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_contributor" ADD CONSTRAINT "project_contributor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ranking_override" ADD CONSTRAINT "ranking_override_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ranking_override" ADD CONSTRAINT "ranking_override_acted_by_user_id_fk" FOREIGN KEY ("acted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "signal_score" ADD CONSTRAINT "signal_score_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "abuse_flag_project_ip_day_idx" ON "abuse_flag" USING btree ("project_id","ip","day");
--> statement-breakpoint
CREATE UNIQUE INDEX "interaction_like_unique_idx" ON "interaction" USING btree ("project_id","user_id","type") WHERE "interaction"."type" = 'like';
--> statement-breakpoint
CREATE INDEX "interaction_dedupe_idx" ON "interaction" USING btree ("project_id","fingerprint","type","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "project_contributor_project_user_idx" ON "project_contributor" USING btree ("project_id","user_id");
--> statement-breakpoint
CREATE INDEX "signal_score_cohort_idx" ON "signal_score" USING btree ("cohort_month");
