import "server-only";
import { access } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { claimSlug, reserveEntitySlug, type Tx } from "@/modules/slugs/registry";
import { isSafeImageSrc, type BlockNode } from "@/modules/blocks/schema";
import { documentText } from "@/modules/blocks/text";
import { UPLOAD_DIR } from "@/modules/uploads/storage";
import { storedImageSize } from "@/modules/uploads/metadata";
import { contentLinks, normalizeSearch, readableWords, parseArticle, publicationErrors } from "./content";
import type { ArticleDraft } from "./types";

const t = schema.articles;
export class ArticleConflict extends Error {}
export async function imageDimensions(src: string) {
  const { width, height } = await storedImageSize(src);
  return { imageWidth: width, imageHeight: height };
}
async function validatePublication(tx: Tx, draft: ArticleDraft) {
  const errors = publicationErrors(draft); if (errors.length) throw new Error(errors.join(" "));
  const [category] = await tx.select().from(schema.blogCategories).where(and(eq(schema.blogCategories.id, draft.categoryId!), eq(schema.blogCategories.enabled, true), eq(schema.blogCategories.archived, false))).for("share");
  if (!category) throw new Error("دسته اصلی فعال و معتبر نیست.");
  const serviceIds = [...new Set([draft.primaryServiceId, ...draft.serviceIds].filter((id): id is number => !!id))];
  if (serviceIds.length) {
    const services = await tx.select({ id: schema.services.id }).from(schema.services).where(and(inArray(schema.services.id, serviceIds), eq(schema.services.published, true)));
    if (services.length !== serviceIds.length) throw new Error("یکی از خدمات مرتبط حذف یا غیرفعال شده است.");
  }
  if (draft.endCta && (!draft.ctaLabel || !/^entity:(service:\d+|page:contact)$/.test(draft.ctaHref))) throw new Error("برای CTA انتهایی متن دکمه و مقصد خدمت یا تماس را انتخاب کنید.");
  const images = new Set<string>(draft.ogImage ? [draft.ogImage] : []);
  const visit = (n: BlockNode) => { if (n.type === "figure") images.add(String(n.attrs?.src)); n.content?.forEach(visit); };
  draft.content.doc.content?.forEach(visit);
  for (const src of images) { if (!isSafeImageSrc(src)) throw new Error("تصویر محتوا معتبر نیست."); await access(path.join(UPLOAD_DIR, path.basename(src))).catch(() => { throw new Error("یکی از تصاویر محتوا دیگر در دسترس نیست."); }); }
  return { ...draft, wordCount: readableWords(draft.content), ...await imageDimensions(draft.image) };
}
async function revision(tx: Tx, row: typeof t.$inferSelect, kind: string, adminId: number | null, plannedAt: Date | null = null) {
  await tx.insert(schema.articleRevisions).values({ articleId: row.id, version: row.version, kind, data: row.draft, adminId, plannedAt });
}
async function publish(tx: Tx, row: typeof t.$inferSelect, now: Date, adminId: number | null) {
  const draft = await validatePublication(tx, parseArticle(row.draft));
  const slug = await claimSlug(tx, "blog", draft.slug, "article", row.id, !!row.publishedAt);
  const changed = !isDeepStrictEqual(row.published, draft);
  const [result] = await tx.update(t).set({ slug, draft, published: draft, categoryId: draft.categoryId, status: "published", publishedAt: row.publishedAt ?? now, contentModifiedAt: changed ? now : row.contentModifiedAt, updatedAt: now, scheduledFor: null, scheduleVersion: null, scheduleError: "", version: row.version + 1, searchText: normalizeSearch(`${draft.title} ${draft.excerpt} ${documentText(draft.content)}`) }).where(eq(t.id, row.id)).returning();
  await tx.delete(schema.articleLinks).where(eq(schema.articleLinks.articleId, row.id));
  const links = contentLinks(draft.content);
  if (draft.endCta && draft.ctaHref) links.push({ blockId: "end-cta", href: draft.ctaHref });
  if (links.length) await tx.insert(schema.articleLinks).values(links.map((l) => ({ ...l, articleId: row.id })));
  await revision(tx, result, "publish", adminId, row.scheduledFor);
  return result;
}
export async function createArticle(adminId: number) {
  const { emptyArticle } = await import("./types");
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(t).values({ draft: emptyArticle() }).returning();
    await revision(tx, row, "create", adminId); return row;
  });
}
export async function mutateArticle(id: number, version: number, operation: string, raw: unknown, adminId: number, scheduledFor?: Date) {
  if (!["save", "publish", "schedule", "cancel", "archive", "trash", "restore"].includes(operation)) throw new Error("عملیات معتبر نیست.");
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(t).where(eq(t.id, id)).for("update");
    if (!row || row.version !== version) throw new ArticleConflict("نسخه جدیدتری ذخیره شده است. نوشته شما حفظ شده؛ صفحه را در تب دیگری باز کنید و تغییرات را مقایسه کنید.");
    if (["trash", "archived"].includes(row.status) && !["restore", "trash", "archive"].includes(operation)) throw new Error("ابتدا مقاله را بازگردانی کنید.");
    if (operation !== "restore" && raw != null) {
      row.draft = parseArticle(raw);
      if (row.draft.slug) await reserveEntitySlug(tx, row.draft.slug, id, "blog", "article");
    }
    if (operation === "publish") return publish(tx, row, new Date(), adminId);
    if (operation === "schedule") {
      if (!scheduledFor || scheduledFor.getTime() <= Date.now()) throw new Error("زمان انتشار باید در آینده باشد.");
      row.draft = await validatePublication(tx, row.draft);
    }
    const nextStatus = operation === "archive" ? "archived" : operation === "trash" ? "trash" : operation === "restore" ? "draft" : operation === "schedule" && !row.published ? "scheduled" : row.published && !["draft", "trash", "archived"].includes(row.status) ? "published" : "draft";
    const [result] = await tx.update(t).set({ draft: row.draft, version: version + 1, status: nextStatus, scheduledFor: operation === "schedule" ? scheduledFor : null, scheduleVersion: operation === "schedule" ? version + 1 : null, scheduleError: "", updatedAt: new Date() }).where(eq(t.id, id)).returning();
    await revision(tx, result, operation, adminId); return result;
  });
}
/** Durable due rows, locked and published once. Edits/cancellation clear the expected version. */
export async function publishDueArticles(now = new Date()) {
  let published = 0;
  for (let i = 0; i < 25; i++) {
    const handled = await db.transaction(async (tx) => {
      const [row] = await tx.select().from(t).where(and(lte(t.scheduledFor, now), sql`${t.scheduleVersion} = ${t.version}`, sql`${t.status} in ('scheduled','published')`)).orderBy(t.scheduledFor).limit(1).for("update", { skipLocked: true });
      if (!row) return false;
      // Savepoint keeps a failed validation from poisoning the outer transaction.
      try { await tx.transaction((nested) => publish(nested, row, now, null)); published++; }
      catch (error) { await tx.update(t).set({ scheduledFor: null, scheduleVersion: null, status: row.published ? "published" : "draft", scheduleError: (error as Error).message.slice(0, 1000) }).where(eq(t.id, row.id)); }
      return true;
    });
    if (!handled) break;
  }
  return published;
}
