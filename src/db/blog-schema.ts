import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { ArticleDraft, CategoryData } from "@/modules/blog/types";

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(), slug: text("slug").notNull(), title: text("title").notNull(),
  data: jsonb("data").$type<CategoryData>().notNull(), enabled: boolean("enabled").notNull().default(true),
  archived: boolean("archived").notNull().default(false), sortOrder: integer("sort_order").notNull().default(0),
  version: integer("version").notNull().default(1), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("blog_categories_slug_idx").on(t.slug)]);

export const articles = pgTable("blog_articles", {
  id: serial("id").primaryKey(), slug: text("slug").notNull().default(""), status: text("status").notNull().default("draft"),
  draft: jsonb("draft").$type<ArticleDraft>().notNull(), published: jsonb("published").$type<ArticleDraft>(),
  categoryId: integer("category_id").references(() => blogCategories.id),
  version: integer("version").notNull().default(1), searchText: text("search_text").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }), contentModifiedAt: timestamp("content_modified_at", { withTimezone: true }),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }), scheduleVersion: integer("schedule_version"),
  scheduleError: text("schedule_error").notNull().default(""),
}, (t) => [index("blog_articles_public_idx").on(t.status, t.publishedAt, t.id), index("blog_articles_category_idx").on(t.categoryId, t.status), index("blog_articles_schedule_idx").on(t.scheduledFor)]);

export const articleRevisions = pgTable("blog_article_revisions", {
  id: serial("id").primaryKey(), articleId: integer("article_id").notNull().references(() => articles.id),
  version: integer("version").notNull(), kind: text("kind").notNull(), data: jsonb("data").$type<ArticleDraft>().notNull(),
  adminId: integer("admin_id"), plannedAt: timestamp("planned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("blog_revisions_article_idx").on(t.articleId, t.version)]);

export const articleLinks = pgTable("blog_article_links", {
  id: serial("id").primaryKey(), articleId: integer("article_id").notNull().references(() => articles.id),
  blockId: text("block_id").notNull(), href: text("href").notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("blog_links_source_idx").on(t.articleId), index("blog_links_target_idx").on(t.href)]);
