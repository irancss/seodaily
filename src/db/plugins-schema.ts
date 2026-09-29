// Tables of the WordPress plugin library (/plugins). Shared by the app and the
// update worker, so nothing here may import server-only modules.
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./schema";

const ts = (name: string) => timestamp(name, { withTimezone: true });

/** Block-editor document (see src/modules/blocks). */
export type BlockDoc = { v: number; doc: unknown };
export type GalleryImage = { url: string; alt: string; width?: number; height?: number };
/** Where a metadata value came from, e.g. { requiresWp: "header", testedUpTo: "readme" }. */
export type Provenance = Record<string, string>;
export type CheckStatus = "PASS" | "FAIL" | "WARNING" | "UNAVAILABLE" | "NOT_APPLICABLE" | "PENDING";
export type ReleaseCheck = { status: CheckStatus; detail: string; at?: string };
export type ReleaseChecks = Partial<Record<"validation" | "identity" | "scan" | "sandbox" | "checksum" | "version", ReleaseCheck>>;
export type PluginHeader = Partial<{
  pluginName: string;
  version: string;
  requiresAtLeast: string;
  requiresPhp: string;
  testedUpTo: string;
  textDomain: string;
  author: string;
  authorUri: string;
  pluginUri: string;
  license: string;
  requiresPlugins: string;
  mainFile: string;
  folder: string;
  fileCount: number;
  unpackedBytes: number;
}>;

/**
 * One address space per section: /plugins/{slug} is either a plugin or a
 * category, never both, and old slugs keep answering with a 301. The unique
 * (namespace, slug) key is what makes that true under concurrent saves.
 */
export const slugRegistry = pgTable(
  "slug_registry",
  {
    namespace: text("namespace").notNull(),
    slug: text("slug").notNull(),
    /** plugin | plugin_category | reserved */
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id"),
    /** current | alias | reserved */
    kind: text("kind").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.namespace, t.slug] }),
    index("slug_registry_entity_idx").on(t.namespace, t.entityType, t.entityId),
    check("slug_registry_kind_check", sql`${t.kind} in ('current', 'alias', 'reserved')`),
    // At most one current slug per entity.
    uniqueIndex("slug_registry_one_current_idx").on(t.namespace, t.entityType, t.entityId).where(sql`kind = 'current'`),
  ],
);

export const pluginCategories = pgTable(
  "plugin_categories",
  {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  h1: text("h1").notNull().default(""),
  description: jsonb("description").$type<BlockDoc | null>(),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("plugin_categories_slug_idx").on(t.slug)],
);

export const plugins = pgTable(
  "plugins",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    originalName: text("original_name").notNull().default(""),
    excerpt: text("excerpt").notNull().default(""),
    /** Working revision edited in the panel; the public page reads contentPublished. */
    contentDraft: jsonb("content_draft").$type<BlockDoc | null>(),
    contentPublished: jsonb("content_published").$type<BlockDoc | null>(),
    /** Optimistic lock for the editor: every save must send the version it started from. */
    revision: integer("revision").notNull().default(1),
    /** draft | published | archived */
    status: text("status").notNull().default("draft"),
    primaryCategoryId: integer("primary_category_id").references(() => pluginCategories.id, { onDelete: "set null" }),
    iconUrl: text("icon_url").notNull().default(""),
    /** auto (from a source) | manual (uploaded or typed by the admin) */
    iconSource: text("icon_source").notNull().default("manual"),
    gallery: jsonb("gallery").$type<GalleryImage[]>().notNull().default([]),
    authorName: text("author_name").notNull().default(""),
    authorUrl: text("author_url").notNull().default(""),
    officialUrl: text("official_url").notNull().default(""),
    license: text("license").notNull().default(""),
    requiresWp: text("requires_wp").notNull().default(""),
    requiresPhp: text("requires_php").notNull().default(""),
    testedUpTo: text("tested_up_to").notNull().default(""),
    /** Which of the metadata fields the admin typed (never overwritten by sources) and where the others came from. */
    manualFields: jsonb("manual_fields").$type<string[]>().notNull().default([]),
    provenance: jsonb("provenance").$type<Provenance>().notNull().default({}),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    seoH1: text("seo_h1").notNull().default(""),
    canonicalUrl: text("canonical_url").notNull().default(""),
    noindex: boolean("noindex").notNull().default(false),
    ogImage: text("og_image").notNull().default(""),
    autoUpdate: boolean("auto_update").notNull().default(true),
    allowPrerelease: boolean("allow_prerelease").notNull().default(false),
    discontinued: boolean("discontinued").notNull().default(false),
    discontinuedNote: text("discontinued_note").notNull().default(""),
    relatedIds: jsonb("related_ids").$type<number[]>().notNull().default([]),
    /** Imported from before the library existed; shown publicly, never used in statistics. */
    baseDownloadCount: integer("base_download_count").notNull().default(0),
    /** Completed downloads, kept equal to the served events in download_events. */
    measuredDownloadCount: integer("measured_download_count").notNull().default(0),
    currentReleaseId: integer("current_release_id"),
    publishedAt: ts("published_at"),
    /** Last change of the public text (not of the file, not of a check). */
    contentUpdatedAt: ts("content_updated_at"),
    /** When the current file was published. */
    packageUpdatedAt: ts("package_updated_at"),
    lastCheckedAt: ts("last_checked_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("plugins_status_idx").on(t.status),
    index("plugins_package_updated_idx").on(t.packageUpdatedAt),
    uniqueIndex("plugins_slug_idx").on(t.slug),
    check("plugins_status_check", sql`${t.status} in ('draft', 'published', 'archived')`),
    check("plugins_base_count_check", sql`${t.baseDownloadCount} >= 0`),
  ],
);

export const pluginCategoryLinks = pgTable(
  "plugin_category_links",
  {
    pluginId: integer("plugin_id")
      .notNull()
      .references(() => plugins.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => pluginCategories.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.pluginId, t.categoryId] }), index("plugin_category_links_category_idx").on(t.categoryId)],
);

export const pluginSources = pgTable(
  "plugin_sources",
  {
    id: serial("id").primaryKey(),
    pluginId: integer("plugin_id")
      .notNull()
      .references(() => plugins.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    /** auto | wordpress_org | html | direct */
    adapter: text("adapter").notNull().default("auto"),
    versionSelector: text("version_selector").notNull().default(""),
    versionAttribute: text("version_attribute").notNull().default(""),
    versionRegex: text("version_regex").notNull().default(""),
    downloadSelector: text("download_selector").notNull().default(""),
    downloadUrl: text("download_url").notNull().default(""),
    /** Lower is more trusted; decides only between equal versions. */
    priority: integer("priority").notNull().default(10),
    enabled: boolean("enabled").notNull().default(true),
    /** ok | unchanged | manual_setup_required | error | never */
    lastStatus: text("last_status").notNull().default("never"),
    lastError: text("last_error").notNull().default(""),
    lastVersion: text("last_version").notNull().default(""),
    lastCheckedAt: ts("last_checked_at"),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    etag: text("etag").notNull().default(""),
    lastModified: text("last_modified").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("plugin_sources_plugin_idx").on(t.pluginId)],
);

export const pluginSourceObservations = pgTable(
  "plugin_source_observations",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id")
      .notNull()
      .references(() => pluginSources.id, { onDelete: "cascade" }),
    observedAt: ts("observed_at").notNull().defaultNow(),
    sourceVersion: text("source_version").notNull().default(""),
    candidateUrl: text("candidate_url").notNull().default(""),
    confidence: integer("confidence").notNull().default(0),
    /** Short, size-capped reasons for the choice; never page content. */
    evidence: jsonb("evidence").$type<string[]>().notNull().default([]),
    result: text("result").notNull(),
    error: text("error").notNull().default(""),
  },
  (t) => [index("plugin_source_observations_source_idx").on(t.sourceId, t.observedAt)],
);

export const pluginReleases = pgTable(
  "plugin_releases",
  {
    id: serial("id").primaryKey(),
    pluginId: integer("plugin_id")
      .notNull()
      .references(() => plugins.id, { onDelete: "cascade" }),
    sourceId: integer("source_id").references(() => pluginSources.id, { onDelete: "set null" }),
    sourceVersion: text("source_version").notNull(),
    packageVersion: text("package_version").notNull().default(""),
    prerelease: boolean("prerelease").notNull().default(false),
    sha256: text("sha256").notNull(),
    bytes: bigint("bytes", { mode: "number" }).notNull(),
    /** objects/<aa>/<sha256>.zip under PLUGIN_FILES_DIR; shared by releases with the same hash. */
    storageKey: text("storage_key").notNull(),
    header: jsonb("header").$type<PluginHeader>().notNull().default({}),
    checks: jsonb("checks").$type<ReleaseChecks>().notNull().default({}),
    warnings: jsonb("warnings").$type<string[]>().notNull().default([]),
    changelog: text("changelog").notNull().default(""),
    /** candidate | review | rejected | published | retired | withdrawn */
    state: text("state").notNull().default("candidate"),
    /** Among the three files offered for download (published and not retired). */
    downloadable: boolean("downloadable").notNull().default(false),
    publishedAt: ts("published_at"),
    retiredAt: ts("retired_at"),
    fileDeletedAt: ts("file_deleted_at"),
    /** Admin who published without a passing scan/sandbox, and why (audited override). */
    overrideBy: integer("override_by").references(() => users.id, { onDelete: "set null" }),
    overrideReason: text("override_reason").notNull().default(""),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("plugin_releases_plugin_sha_idx").on(t.pluginId, t.sha256),
    check(
      "plugin_releases_state_check",
      sql`${t.state} in ('candidate', 'review', 'rejected', 'published', 'retired', 'withdrawn')`,
    ),
    check("plugin_releases_downloadable_check", sql`not ${t.downloadable} or ${t.state} = 'published'`),
    index("plugin_releases_plugin_state_idx").on(t.pluginId, t.state),
    index("plugin_releases_sha_idx").on(t.sha256),
  ],
);

export const pluginJobs = pgTable(
  "plugin_jobs",
  {
    id: serial("id").primaryKey(),
    /** check_plugin | cleanup */
    kind: text("kind").notNull(),
    pluginId: integer("plugin_id").references(() => plugins.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    /** queued | running | done | failed | cancelled */
    state: text("state").notNull().default("queued"),
    /** schedule | admin | system */
    requestedBy: text("requested_by").notNull().default("system"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    runAfter: ts("run_after").notNull().defaultNow(),
    leaseUntil: ts("lease_until"),
    leaseOwner: text("lease_owner").notNull().default(""),
    /** Bumped on every claim; a worker that lost its lease cannot write results. */
    fencing: integer("fencing").notNull().default(0),
    cancelRequested: boolean("cancel_requested").notNull().default(false),
    log: jsonb("log").$type<string[]>().notNull().default([]),
    result: jsonb("result").$type<Record<string, unknown>>().notNull().default({}),
    error: text("error").notNull().default(""),
    createdAt: ts("created_at").notNull().defaultNow(),
    startedAt: ts("started_at"),
    finishedAt: ts("finished_at"),
  },
  (t) => [
    uniqueIndex("plugin_jobs_idempotency_idx").on(t.idempotencyKey),
    // One pending or running check per plugin: a click during the nightly run joins it.
    uniqueIndex("plugin_jobs_one_active_check_idx")
      .on(t.pluginId)
      .where(sql`kind = 'check_plugin' and state in ('queued', 'running')`),
    index("plugin_jobs_claim_idx").on(t.state, t.runAfter),
    check("plugin_jobs_state_check", sql`${t.state} in ('queued', 'running', 'done', 'failed', 'cancelled')`),
  ],
);

/** One row per Tehran calendar day the nightly check ran for: the dedupe key across workers and restarts. */
export const pluginScheduleRuns = pgTable("plugin_schedule_runs", {
  runDate: text("run_date").primaryKey(),
  startedAt: ts("started_at").notNull().defaultNow(),
  pluginsQueued: integer("plugins_queued").notNull().default(0),
});

export const workerHeartbeats = pgTable("worker_heartbeats", {
  workerId: text("worker_id").primaryKey(),
  version: text("version").notNull().default(""),
  startedAt: ts("started_at").notNull().defaultNow(),
  seenAt: ts("seen_at").notNull().defaultNow(),
  /** Scanner/sandbox/disk state the worker saw last, for the admin monitor. */
  health: jsonb("health").$type<Record<string, unknown>>().notNull().default({}),
});

export const pluginGlobalBlocks = pgTable("plugin_global_blocks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull().default(""),
  content: jsonb("content").$type<BlockDoc | null>(),
  /** before_download | after_download | page_end */
  position: text("position").notNull().default("page_end"),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  appliesToAll: boolean("applies_to_all").notNull().default(true),
  includeIds: jsonb("include_ids").$type<number[]>().notNull().default([]),
  excludeIds: jsonb("exclude_ids").$type<number[]>().notNull().default([]),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

/** Visitors who confirmed an Iranian mobile number to download files. Not admin users. */
export const downloadUsers = pgTable(
  "download_users",
  {
    id: serial("id").primaryKey(),
    /** E.164, e.g. +989121234567 */
    phone: text("phone").notNull(),
    verifiedAt: ts("verified_at").notNull().defaultNow(),
    createdAt: ts("created_at").notNull().defaultNow(),
    lastSeenAt: ts("last_seen_at"),
    lastDownloadAt: ts("last_download_at"),
    blocked: boolean("blocked").notNull().default(false),
    blockedReason: text("blocked_reason").notNull().default(""),
    /** Set when the owner removes the person's data; aggregate counts stay. */
    anonymizedAt: ts("anonymized_at"),
  },
  (t) => [uniqueIndex("download_users_phone_idx").on(t.phone)],
);

export const otpChallenges = pgTable(
  "otp_challenges",
  {
    id: text("id").primaryKey(),
    purpose: text("purpose").notNull(),
    phone: text("phone").notNull(),
    /** HMAC of id, purpose, phone and code with a secret kept outside the database. */
    digest: text("digest").notNull(),
    expiresAt: ts("expires_at").notNull(),
    attempts: integer("attempts").notNull().default(0),
    /** pending | sent | failed | unknown */
    sendState: text("send_state").notNull().default("pending"),
    sendError: text("send_error").notNull().default(""),
    providerRef: text("provider_ref").notNull().default(""),
    ipHash: text("ip_hash").notNull().default(""),
    consumedAt: ts("consumed_at"),
    invalidatedAt: ts("invalidated_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("otp_challenges_phone_idx").on(t.phone, t.createdAt), index("otp_challenges_ip_idx").on(t.ipHash, t.createdAt)],
);

export const downloadSessions = pgTable(
  "download_sessions",
  {
    id: serial("id").primaryKey(),
    tokenDigest: text("token_digest").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => downloadUsers.id, { onDelete: "cascade" }),
    createdAt: ts("created_at").notNull().defaultNow(),
    expiresAt: ts("expires_at").notNull(),
    revokedAt: ts("revoked_at"),
  },
  (t) => [uniqueIndex("download_sessions_token_idx").on(t.tokenDigest), index("download_sessions_user_idx").on(t.userId)],
);

export const downloadGrants = pgTable(
  "download_grants",
  {
    /** Random, used in the file URL; useless without the session cookie it is bound to. */
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => downloadUsers.id, { onDelete: "cascade" }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => downloadSessions.id, { onDelete: "cascade" }),
    releaseId: integer("release_id")
      .notNull()
      .references(() => pluginReleases.id, { onDelete: "cascade" }),
    sha256: text("sha256").notNull(),
    ipHash: text("ip_hash").notNull().default(""),
    createdAt: ts("created_at").notNull().defaultNow(),
    expiresAt: ts("expires_at").notNull(),
    /** First file request: the logical download that counts towards the hourly caps. */
    startedAt: ts("started_at"),
    servedAt: ts("served_at"),
  },
  (t) => [index("download_grants_user_started_idx").on(t.userId, t.startedAt), index("download_grants_ip_started_idx").on(t.ipHash, t.startedAt)],
);

/** Ledger of download facts; public counts are derived from the `served` rows. */
export const downloadEvents = pgTable(
  "download_events",
  {
    id: serial("id").primaryKey(),
    /** grant_issued | started | served | failed | unknown */
    kind: text("kind").notNull(),
    grantId: text("grant_id"),
    pluginId: integer("plugin_id").references(() => plugins.id, { onDelete: "set null" }),
    releaseId: integer("release_id").references(() => pluginReleases.id, { onDelete: "set null" }),
    userId: integer("user_id").references(() => downloadUsers.id, { onDelete: "set null" }),
    /** One served/started row per grant, whatever the retries. */
    dedupeKey: text("dedupe_key"),
    bytes: bigint("bytes", { mode: "number" }).notNull().default(0),
    detail: text("detail").notNull().default(""),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("download_events_dedupe_idx").on(t.dedupeKey),
    index("download_events_kind_created_idx").on(t.kind, t.createdAt),
    index("download_events_plugin_idx").on(t.pluginId, t.kind),
    index("download_events_user_idx").on(t.userId),
    check("download_events_kind_check", sql`${t.kind} in ('grant_issued', 'started', 'served', 'failed', 'unknown')`),
  ],
);

/** Admin actions on sensitive data: base-count changes, CSV exports, blocking users, overrides. */
export const adminAudit = pgTable(
  "admin_audit",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull().default(""),
    targetId: text("target_id").notNull().default(""),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("admin_audit_created_idx").on(t.createdAt), index("admin_audit_target_idx").on(t.targetType, t.targetId)],
);
