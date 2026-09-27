CREATE TABLE "categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"business" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"service" text NOT NULL,
	"budget" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"project_type" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"website_url" text DEFAULT '' NOT NULL,
	"problem" text DEFAULT '' NOT NULL,
	"solution" text DEFAULT '' NOT NULL,
	"result" text DEFAULT '' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"is_case_study" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"english_title" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT 'layers' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"hero_description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"problem_intro" text DEFAULT '' NOT NULL,
	"problems" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"includes_intro" text DEFAULT '' NOT NULL,
	"includes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"process" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"for_who_intro" text DEFAULT '' NOT NULL,
	"situations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"business_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deliverables_intro" text DEFAULT '' NOT NULL,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"meta_title" text DEFAULT '' NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"photo_url" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT 'مدیر' NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_categories_slug_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");