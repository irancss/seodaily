ALTER TABLE "services" ADD COLUMN "overview" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "sections" jsonb DEFAULT '[]'::jsonb NOT NULL;