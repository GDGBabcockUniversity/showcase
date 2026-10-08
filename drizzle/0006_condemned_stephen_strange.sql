CREATE TABLE "collaboration_request" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"message" varchar(1000) NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_request_report" (
	"request_id" text PRIMARY KEY NOT NULL,
	"reported_by" text NOT NULL,
	"reason" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"maker_id" text,
	"project_id" text,
	"muted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showcase_collection" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" varchar(500) NOT NULL,
	"created_by" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "showcase_collection_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "showcase_collection_project" (
	"id" text PRIMARY KEY NOT NULL,
	"collection_id" text NOT NULL,
	"project_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "open_to_collaboration" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "requested_skills" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "collaboration_request" ADD CONSTRAINT "collaboration_request_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_request" ADD CONSTRAINT "collaboration_request_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_request_report" ADD CONSTRAINT "collaboration_request_report_request_id_collaboration_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."collaboration_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_request_report" ADD CONSTRAINT "collaboration_request_report_reported_by_user_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_maker_id_user_id_fk" FOREIGN KEY ("maker_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_collection" ADD CONSTRAINT "showcase_collection_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_collection_project" ADD CONSTRAINT "showcase_collection_project_collection_id_showcase_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."showcase_collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showcase_collection_project" ADD CONSTRAINT "showcase_collection_project_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "follow_user_maker_idx" ON "follow" USING btree ("user_id","maker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follow_user_project_idx" ON "follow" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "showcase_collection_project_idx" ON "showcase_collection_project" USING btree ("collection_id","project_id");