ALTER TABLE "follow" ADD CONSTRAINT "follow_one_target_check" CHECK (("maker_id" IS NOT NULL) <> ("project_id" IS NOT NULL));
