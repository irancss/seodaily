CREATE TABLE "admin_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"target_type" text DEFAULT '' NOT NULL,
	"target_id" text DEFAULT '' NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "download_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"grant_id" text,
	"plugin_id" integer,
	"release_id" integer,
	"user_id" integer,
	"dedupe_key" text,
	"bytes" bigint DEFAULT 0 NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "download_events_kind_check" CHECK ("download_events"."kind" in ('grant_issued', 'started', 'served', 'failed', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "download_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" integer NOT NULL,
	"release_id" integer NOT NULL,
	"sha256" text NOT NULL,
	"ip_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"served_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "download_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_digest" text NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "download_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"last_download_at" timestamp with time zone,
	"blocked" boolean DEFAULT false NOT NULL,
	"blocked_reason" text DEFAULT '' NOT NULL,
	"anonymized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"purpose" text NOT NULL,
	"phone" text NOT NULL,
	"digest" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"send_state" text DEFAULT 'pending' NOT NULL,
	"send_error" text DEFAULT '' NOT NULL,
	"provider_ref" text DEFAULT '' NOT NULL,
	"ip_hash" text DEFAULT '' NOT NULL,
	"consumed_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"h1" text DEFAULT '' NOT NULL,
	"description" jsonb,
	"seo_title" text DEFAULT '' NOT NULL,
	"seo_description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_category_links" (
	"plugin_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "plugin_category_links_plugin_id_category_id_pk" PRIMARY KEY("plugin_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "plugin_global_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" jsonb,
	"position" text DEFAULT 'page_end' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"applies_to_all" boolean DEFAULT true NOT NULL,
	"include_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exclude_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"plugin_id" integer,
	"idempotency_key" text NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"requested_by" text DEFAULT 'system' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_until" timestamp with time zone,
	"lease_owner" text DEFAULT '' NOT NULL,
	"fencing" integer DEFAULT 0 NOT NULL,
	"cancel_requested" boolean DEFAULT false NOT NULL,
	"log" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "plugin_jobs_state_check" CHECK ("plugin_jobs"."state" in ('queued', 'running', 'done', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "plugin_releases" (
	"id" serial PRIMARY KEY NOT NULL,
	"plugin_id" integer NOT NULL,
	"source_id" integer,
	"source_version" text NOT NULL,
	"package_version" text DEFAULT '' NOT NULL,
	"prerelease" boolean DEFAULT false NOT NULL,
	"sha256" text NOT NULL,
	"bytes" bigint NOT NULL,
	"storage_key" text NOT NULL,
	"header" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checks" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"changelog" text DEFAULT '' NOT NULL,
	"state" text DEFAULT 'candidate' NOT NULL,
	"downloadable" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"retired_at" timestamp with time zone,
	"file_deleted_at" timestamp with time zone,
	"override_by" integer,
	"override_reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_releases_state_check" CHECK ("plugin_releases"."state" in ('candidate', 'review', 'rejected', 'published', 'retired', 'withdrawn')),
	CONSTRAINT "plugin_releases_downloadable_check" CHECK (not "plugin_releases"."downloadable" or "plugin_releases"."state" = 'published')
);
--> statement-breakpoint
CREATE TABLE "plugin_schedule_runs" (
	"run_date" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"plugins_queued" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_source_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_version" text DEFAULT '' NOT NULL,
	"candidate_url" text DEFAULT '' NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" text NOT NULL,
	"error" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"plugin_id" integer NOT NULL,
	"url" text NOT NULL,
	"adapter" text DEFAULT 'auto' NOT NULL,
	"version_selector" text DEFAULT '' NOT NULL,
	"version_attribute" text DEFAULT '' NOT NULL,
	"version_regex" text DEFAULT '' NOT NULL,
	"download_selector" text DEFAULT '' NOT NULL,
	"download_url" text DEFAULT '' NOT NULL,
	"priority" integer DEFAULT 10 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_status" text DEFAULT 'never' NOT NULL,
	"last_error" text DEFAULT '' NOT NULL,
	"last_version" text DEFAULT '' NOT NULL,
	"last_checked_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"etag" text DEFAULT '' NOT NULL,
	"last_modified" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugins" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"original_name" text DEFAULT '' NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content_draft" jsonb,
	"content_published" jsonb,
	"revision" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"primary_category_id" integer,
	"icon_url" text DEFAULT '' NOT NULL,
	"icon_source" text DEFAULT 'manual' NOT NULL,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"author_name" text DEFAULT '' NOT NULL,
	"author_url" text DEFAULT '' NOT NULL,
	"official_url" text DEFAULT '' NOT NULL,
	"license" text DEFAULT '' NOT NULL,
	"requires_wp" text DEFAULT '' NOT NULL,
	"requires_php" text DEFAULT '' NOT NULL,
	"tested_up_to" text DEFAULT '' NOT NULL,
	"manual_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_title" text DEFAULT '' NOT NULL,
	"seo_description" text DEFAULT '' NOT NULL,
	"seo_h1" text DEFAULT '' NOT NULL,
	"canonical_url" text DEFAULT '' NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"og_image" text DEFAULT '' NOT NULL,
	"auto_update" boolean DEFAULT true NOT NULL,
	"allow_prerelease" boolean DEFAULT false NOT NULL,
	"discontinued" boolean DEFAULT false NOT NULL,
	"discontinued_note" text DEFAULT '' NOT NULL,
	"related_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"base_download_count" integer DEFAULT 0 NOT NULL,
	"measured_download_count" integer DEFAULT 0 NOT NULL,
	"current_release_id" integer,
	"published_at" timestamp with time zone,
	"content_updated_at" timestamp with time zone,
	"package_updated_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plugins_status_check" CHECK ("plugins"."status" in ('draft', 'published', 'archived')),
	CONSTRAINT "plugins_base_count_check" CHECK ("plugins"."base_download_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "slug_registry" (
	"namespace" text NOT NULL,
	"slug" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slug_registry_namespace_slug_pk" PRIMARY KEY("namespace","slug"),
	CONSTRAINT "slug_registry_kind_check" CHECK ("slug_registry"."kind" in ('current', 'alias', 'reserved'))
);
--> statement-breakpoint
CREATE TABLE "worker_heartbeats" (
	"worker_id" text PRIMARY KEY NOT NULL,
	"version" text DEFAULT '' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"health" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_events" ADD CONSTRAINT "download_events_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_events" ADD CONSTRAINT "download_events_release_id_plugin_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."plugin_releases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_events" ADD CONSTRAINT "download_events_user_id_download_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."download_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_grants" ADD CONSTRAINT "download_grants_user_id_download_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."download_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_grants" ADD CONSTRAINT "download_grants_session_id_download_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."download_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_grants" ADD CONSTRAINT "download_grants_release_id_plugin_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."plugin_releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_sessions" ADD CONSTRAINT "download_sessions_user_id_download_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."download_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_category_links" ADD CONSTRAINT "plugin_category_links_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_category_links" ADD CONSTRAINT "plugin_category_links_category_id_plugin_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."plugin_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_jobs" ADD CONSTRAINT "plugin_jobs_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_releases" ADD CONSTRAINT "plugin_releases_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_releases" ADD CONSTRAINT "plugin_releases_source_id_plugin_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."plugin_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_releases" ADD CONSTRAINT "plugin_releases_override_by_users_id_fk" FOREIGN KEY ("override_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_source_observations" ADD CONSTRAINT "plugin_source_observations_source_id_plugin_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."plugin_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_sources" ADD CONSTRAINT "plugin_sources_plugin_id_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugins" ADD CONSTRAINT "plugins_primary_category_id_plugin_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."plugin_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_created_idx" ON "admin_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_target_idx" ON "admin_audit" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "download_events_dedupe_idx" ON "download_events" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "download_events_kind_created_idx" ON "download_events" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "download_events_plugin_idx" ON "download_events" USING btree ("plugin_id","kind");--> statement-breakpoint
CREATE INDEX "download_events_user_idx" ON "download_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "download_grants_user_started_idx" ON "download_grants" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "download_grants_ip_started_idx" ON "download_grants" USING btree ("ip_hash","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "download_sessions_token_idx" ON "download_sessions" USING btree ("token_digest");--> statement-breakpoint
CREATE INDEX "download_sessions_user_idx" ON "download_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "download_users_phone_idx" ON "download_users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "otp_challenges_phone_idx" ON "otp_challenges" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_ip_idx" ON "otp_challenges" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_categories_slug_idx" ON "plugin_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "plugin_category_links_category_idx" ON "plugin_category_links" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_jobs_idempotency_idx" ON "plugin_jobs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_jobs_one_active_check_idx" ON "plugin_jobs" USING btree ("plugin_id") WHERE kind = 'check_plugin' and state in ('queued', 'running');--> statement-breakpoint
CREATE INDEX "plugin_jobs_claim_idx" ON "plugin_jobs" USING btree ("state","run_after");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_releases_plugin_sha_idx" ON "plugin_releases" USING btree ("plugin_id","sha256");--> statement-breakpoint
CREATE INDEX "plugin_releases_plugin_state_idx" ON "plugin_releases" USING btree ("plugin_id","state");--> statement-breakpoint
CREATE INDEX "plugin_releases_sha_idx" ON "plugin_releases" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "plugin_source_observations_source_idx" ON "plugin_source_observations" USING btree ("source_id","observed_at");--> statement-breakpoint
CREATE INDEX "plugin_sources_plugin_idx" ON "plugin_sources" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "plugins_status_idx" ON "plugins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "plugins_package_updated_idx" ON "plugins" USING btree ("package_updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "plugins_slug_idx" ON "plugins" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "slug_registry_entity_idx" ON "slug_registry" USING btree ("namespace","entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_registry_one_current_idx" ON "slug_registry" USING btree ("namespace","entity_type","entity_id") WHERE kind = 'current';--> statement-breakpoint
-- Route words under /plugins/ that no plugin or category may take (reserved, no page of their own).
INSERT INTO "slug_registry" ("namespace", "slug", "entity_type", "entity_id", "kind") VALUES
  ('plugins', 'search', 'reserved', NULL, 'reserved'),
  ('plugins', 'download', 'reserved', NULL, 'reserved'),
  ('plugins', 'downloads', 'reserved', NULL, 'reserved'),
  ('plugins', 'preview', 'reserved', NULL, 'reserved'),
  ('plugins', 'admin', 'reserved', NULL, 'reserved'),
  ('plugins', 'updates', 'reserved', NULL, 'reserved'),
  ('plugins', 'feed', 'reserved', NULL, 'reserved'),
  ('plugins', 'rss', 'reserved', NULL, 'reserved'),
  ('plugins', 'page', 'reserved', NULL, 'reserved'),
  ('plugins', 'category', 'reserved', NULL, 'reserved'),
  ('plugins', 'categories', 'reserved', NULL, 'reserved'),
  ('plugins', 'api', 'reserved', NULL, 'reserved'),
  ('plugins', 'new', 'reserved', NULL, 'reserved'),
  ('plugins', 'sitemap', 'reserved', NULL, 'reserved'),
  ('plugins', 'themes', 'reserved', NULL, 'reserved')
ON CONFLICT DO NOTHING;
