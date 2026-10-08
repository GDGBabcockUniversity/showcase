CREATE UNIQUE INDEX "collaboration_request_open_unique_idx" ON "collaboration_request" USING btree ("project_id","sender_id") WHERE "status" = 'OPEN';
