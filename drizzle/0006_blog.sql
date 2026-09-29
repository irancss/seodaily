CREATE TABLE blog_categories (
 id serial PRIMARY KEY, slug text NOT NULL, title text NOT NULL, data jsonb NOT NULL,
 enabled boolean NOT NULL DEFAULT true, archived boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0,
 version integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX blog_categories_slug_idx ON blog_categories(slug);
--> statement-breakpoint
CREATE TABLE blog_articles (
 id serial PRIMARY KEY, slug text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','scheduled','archived','trash')),
 draft jsonb NOT NULL, published jsonb, category_id integer REFERENCES blog_categories(id), version integer NOT NULL DEFAULT 1,
 search_text text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz, content_modified_at timestamptz, scheduled_for timestamptz, schedule_version integer, schedule_error text NOT NULL DEFAULT ''
);
--> statement-breakpoint
CREATE INDEX blog_articles_public_idx ON blog_articles(status,published_at,id);
CREATE INDEX blog_articles_category_idx ON blog_articles(category_id,status);
CREATE INDEX blog_articles_schedule_idx ON blog_articles(scheduled_for) WHERE scheduled_for IS NOT NULL;
--> statement-breakpoint
CREATE TABLE blog_article_revisions (
 id serial PRIMARY KEY, article_id integer NOT NULL REFERENCES blog_articles(id), version integer NOT NULL, kind text NOT NULL,
 data jsonb NOT NULL, admin_id integer, planned_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_revisions_article_idx ON blog_article_revisions(article_id,version);
--> statement-breakpoint
CREATE TABLE blog_article_links (
 id serial PRIMARY KEY, article_id integer NOT NULL REFERENCES blog_articles(id), block_id text NOT NULL,
 href text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_links_source_idx ON blog_article_links(article_id);
CREATE INDEX blog_links_target_idx ON blog_article_links(href);
