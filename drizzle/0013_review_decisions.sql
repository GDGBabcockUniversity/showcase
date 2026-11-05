ALTER TABLE "project" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;