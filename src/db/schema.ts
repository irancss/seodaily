import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type TitledItem = { title: string; description: string };
export type FaqItem = { question: string; answer: string };

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull().default("مدیر"),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/**
 * The two main services (طراحی سایت / سئو). Their pages are bespoke designs, so
 * the rows are fixed by the seed and only their texts are editable.
 */
export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Sub-services, rendered with the SD05 service template. */
export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    category: text("category")
      .notNull()
      .references(() => categories.slug),
    title: text("title").notNull(),
    englishTitle: text("english_title").notNull().default(""),
    icon: text("icon").notNull().default("layers"),
    summary: text("summary").notNull().default(""),
    heroDescription: text("hero_description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    problemIntro: text("problem_intro").notNull().default(""),
    problems: jsonb("problems").$type<string[]>().notNull().default([]),
    includesIntro: text("includes_intro").notNull().default(""),
    includes: jsonb("includes").$type<TitledItem[]>().notNull().default([]),
    process: jsonb("process").$type<TitledItem[]>().notNull().default([]),
    forWhoIntro: text("for_who_intro").notNull().default(""),
    situations: jsonb("situations").$type<string[]>().notNull().default([]),
    businessTypes: jsonb("business_types").$type<string[]>().notNull().default([]),
    deliverablesIntro: text("deliverables_intro").notNull().default(""),
    deliverables: jsonb("deliverables").$type<TitledItem[]>().notNull().default([]),
    faqs: jsonb("faqs").$type<FaqItem[]>().notNull().default([]),
    relatedSlugs: jsonb("related_slugs").$type<string[]>().notNull().default([]),
    metaTitle: text("meta_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    published: boolean("published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("services_slug_idx").on(t.slug)],
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    /** Filter label on the portfolio page, e.g. «فروشگاهی», «شرکتی». */
    projectType: text("project_type").notNull().default(""),
    /** Which main service it belongs to — web-design, seo, or empty. */
    category: text("category").notNull().default(""),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    websiteUrl: text("website_url").notNull().default(""),
    problem: text("problem").notNull().default(""),
    solution: text("solution").notNull().default(""),
    result: text("result").notNull().default(""),
    featured: boolean("featured").notNull().default(false),
    isCaseStudy: boolean("is_case_study").notNull().default(false),
    published: boolean("published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_slug_idx").on(t.slug)],
);

export const LEAD_STATUSES = ["new", "in_progress", "done", "archived"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const SERVICE_CHOICES = [
  "web-design",
  "seo",
  "web-design-seo",
  "redesign",
  "content",
  "not-sure",
] as const;
export type ServiceChoice = (typeof SERVICE_CHOICES)[number];

/** One line of a price estimate. Amounts are toman; 0 means «توافقی». */
export type EstimateItem = { group: string; label: string; qty: number; unitPrice: number; amount: number };

/** Price estimate of a lead: built on the pricing page, or typed in by the admin. */
export type LeadEstimate = {
  service: "web-design" | "seo" | "content";
  planId?: string;
  items: EstimateItem[];
  total: number;
  source: "calculator" | "manual";
};

/** Consultation requests submitted from the contact and pricing pages. */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  business: text("business").notNull().default(""),
  website: text("website").notNull().default(""),
  service: text("service").$type<ServiceChoice>().notNull(),
  budget: text("budget").notNull().default(""),
  description: text("description").notNull().default(""),
  status: text("status").$type<LeadStatus>().notNull().default("new"),
  adminNote: text("admin_note").notNull().default(""),
  estimate: jsonb("estimate").$type<LeadEstimate>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const FAQ_PAGES = ["home", "services", "web-design", "seo"] as const;
export type FaqPage = (typeof FAQ_PAGES)[number];

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  page: text("page").$type<FaqPage>().notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  bio: text("bio").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

/** Key/value store for site settings and editable page texts. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Service = typeof services.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Category = typeof categories.$inferSelect;
