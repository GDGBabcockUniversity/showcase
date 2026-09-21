ALTER TABLE "project" ADD CONSTRAINT "project_department_department_id_fk" FOREIGN KEY ("department") REFERENCES "public"."department"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_department_department_id_fk" FOREIGN KEY ("department") REFERENCES "public"."department"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "tags";
