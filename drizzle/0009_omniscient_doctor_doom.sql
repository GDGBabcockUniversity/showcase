ALTER TABLE "interaction" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_parent_id_interaction_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."interaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interaction_parent_idx" ON "interaction" USING btree ("parent_id");