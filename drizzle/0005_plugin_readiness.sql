ALTER TABLE "plugins" ADD COLUMN "draft_data" jsonb;
--> statement-breakpoint
ALTER TABLE "plugin_categories" ADD COLUMN "canonical_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "plugin_categories" ADD COLUMN "noindex" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "download_grants" ADD COLUMN "served_ranges" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "plugin_releases" ADD COLUMN "review_expires_at" timestamp with time zone DEFAULT now() + interval '30 days' NOT NULL;
--> statement-breakpoint
UPDATE "plugin_releases" SET "review_expires_at" = "created_at" + interval '30 days';
