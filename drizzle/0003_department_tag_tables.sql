CREATE TABLE "department" (
	"id" text PRIMARY KEY NOT NULL
);

--> statement-breakpoint
CREATE TABLE "project_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"tag_id" text NOT NULL
);

--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);

--> statement-breakpoint
ALTER TABLE "project_tag" ADD CONSTRAINT "project_tag_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_tag" ADD CONSTRAINT "project_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "project_tag_project_tag_idx" ON "project_tag" USING btree ("project_id","tag_id");
