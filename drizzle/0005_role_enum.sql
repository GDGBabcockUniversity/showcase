CREATE TYPE "public"."role" AS ENUM('USER', 'REVIEWER', 'ADMIN');
--> statement-breakpoint
UPDATE "user" SET "role" = COALESCE(UPPER("role"), 'USER');
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'USER'::"public"."role";
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;
