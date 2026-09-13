DROP TABLE "click" CASCADE;
--> statement-breakpoint
DROP TABLE "comment" CASCADE;
--> statement-breakpoint
DROP TABLE "like" CASCADE;
--> statement-breakpoint
DROP TABLE "view" CASCADE;
--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "collaborators";
--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "release_at";
