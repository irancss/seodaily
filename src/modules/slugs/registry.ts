import "server-only";

import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { isUniqueViolation } from "@/lib/db-errors";

import { isReservedSlug, normalizeSlug, type SlugNamespace } from "./normalize";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type SlugEntity = "plugin" | "plugin_category" | "article" | "blog_category";

export class SlugError extends Error {}

/** Reserve an editor's address without redirecting the public URL. */
export async function reserveEntitySlug(tx: Tx, raw: string, id: number, namespace: SlugNamespace, entityType: SlugEntity) {
  const slug = normalizeSlug(raw);
  if (!slug || isReservedSlug(namespace, slug)) throw new SlugError("نامک معتبر نیست یا برای مسیر دیگری رزرو شده است.");
  const t = schema.slugRegistry;
  const [existing] = await tx.select().from(t).where(and(eq(t.namespace, namespace), eq(t.slug, slug))).for("update");
  if (existing && (existing.entityType !== entityType || existing.entityId !== id)) throw new SlugError("این نامک قبلاً استفاده شده است.");
  await tx.delete(t).where(and(eq(t.namespace, namespace), eq(t.entityType, entityType), eq(t.entityId, id), eq(t.kind, "reserved")));
  if (!existing || existing.kind === "reserved") {
    try {
      await tx.insert(t).values({ namespace, slug, entityType, entityId: id, kind: "reserved" });
    } catch (error) {
      if (isUniqueViolation(error)) throw new SlugError("این نامک هم‌زمان توسط صفحه دیگری رزرو شد.");
      throw error;
    }
  }
  return slug;
}

export const reservePluginSlug = (tx: Tx, raw: string, id: number) => reserveEntitySlug(tx, raw, id, "plugins", "plugin");

const ENTITY_LABEL: Record<string, string> = { plugin: "افزونه", plugin_category: "دسته", reserved: "مسیر رزروشده سایت" };

/**
 * Makes `slug` the current address of an entity inside the caller's
 * transaction. The (namespace, slug) primary key decides races: of two
 * concurrent saves wanting the same slug, one gets a unique violation and a
 * SlugError. The entity's previous slug becomes a permanent 301 alias when the
 * entity was already public (`keepOldAsAlias`), otherwise it is freed.
 */
export async function claimSlug(
  tx: Tx,
  namespace: SlugNamespace,
  rawSlug: string,
  entityType: SlugEntity,
  entityId: number,
  keepOldAsAlias: boolean,
): Promise<string> {
  const slug = normalizeSlug(rawSlug);
  if (!slug) throw new SlugError("نامک (آدرس) معتبر نیست. از حروف فارسی یا انگلیسی، عدد و خط تیره استفاده کنید.");
  if (isReservedSlug(namespace, slug)) throw new SlugError(`«${slug}» یک مسیر رزروشده سایت است و نمی‌تواند نامک باشد.`);

  const t = schema.slugRegistry;
  const [existing] = await tx.select().from(t).where(and(eq(t.namespace, namespace), eq(t.slug, slug))).for("update");
  const mine = existing && existing.entityType === entityType && existing.entityId === entityId;
  if (existing && !mine) {
    throw new SlugError(`نامک «${slug}» قبلاً برای یک ${ENTITY_LABEL[existing.entityType] ?? "صفحه"} دیگر استفاده شده است.`);
  }
  if (existing?.kind === "current") return slug;

  // The old current slug steps down first (one current per entity).
  const current = and(eq(t.namespace, namespace), eq(t.entityType, entityType), eq(t.entityId, entityId), eq(t.kind, "current"));
  if (keepOldAsAlias) await tx.update(t).set({ kind: "alias" }).where(current);
  else await tx.delete(t).where(current);

  try {
    if (mine) {
      // Taking back one of its own old aliases.
      await tx.update(t).set({ kind: "current" }).where(and(eq(t.namespace, namespace), eq(t.slug, slug)));
    } else {
      await tx.insert(t).values({ namespace, slug, entityType, entityId, kind: "current" });
    }
  } catch (error) {
    if (isUniqueViolation(error)) throw new SlugError(`نامک «${slug}» هم‌زمان توسط صفحه دیگری گرفته شد. دوباره تلاش کنید.`);
    throw error;
  }
  return slug;
}

/** Frees every address of a deleted entity (its old URLs answer 404). */
export async function releaseSlugs(tx: Tx, namespace: SlugNamespace, entityType: SlugEntity, entityId: number) {
  const t = schema.slugRegistry;
  await tx.delete(t).where(and(eq(t.namespace, namespace), eq(t.entityType, entityType), eq(t.entityId, entityId)));
}

export type ResolvedSlug =
  | { kind: "current"; entityType: SlugEntity; entityId: number; slug: string }
  | { kind: "alias"; entityType: SlugEntity; entityId: number; currentSlug: string }
  | null;

/** What /{namespace}/{slug} points to; aliases resolve to the entity's current slug in one hop. */
export async function resolveSlug(namespace: SlugNamespace, slug: string): Promise<ResolvedSlug> {
  const t = schema.slugRegistry;
  const [row] = await db.select().from(t).where(and(eq(t.namespace, namespace), eq(t.slug, slug))).limit(1);
  if (!row || row.kind === "reserved" || row.entityId === null) return null;
  const entityType = row.entityType as SlugEntity;
  if (row.kind === "current") return { kind: "current", entityType, entityId: row.entityId, slug };
  const [current] = await db
    .select({ slug: t.slug })
    .from(t)
    .where(and(eq(t.namespace, namespace), eq(t.entityType, entityType), eq(t.entityId, row.entityId), eq(t.kind, "current")))
    .limit(1);
  return current ? { kind: "alias", entityType, entityId: row.entityId, currentSlug: current.slug } : null;
}
