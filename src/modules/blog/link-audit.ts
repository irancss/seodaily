import "server-only";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { SITE_PAGES } from "@/modules/blocks/schema";
import { entityHrefs } from "@/modules/plugins/queries";
import { getSiteUrl } from "@/modules/seo/metadata";
import { blogRoute } from "./routes";
import { contentLinks } from "./content";
import type { ArticleDraft } from "./types";

/** Count only published editorial links, including manually entered current/old URLs. */
export async function incomingArticleLinks(id: number) {
  const [routes, base] = await Promise.all([
    db.select({ slug: schema.slugRegistry.slug }).from(schema.slugRegistry).where(and(eq(schema.slugRegistry.namespace, "blog"), eq(schema.slugRegistry.entityType, "article"), eq(schema.slugRegistry.entityId, id), inArray(schema.slugRegistry.kind, ["current", "alias"]))),
    getSiteUrl(),
  ]);
  const urls = [...new Set(routes.flatMap(({ slug }) => [slug, encodeURIComponent(slug)].flatMap((value) => [`/blog/${value}`, `${base}/blog/${value}`])))];
  const href = sql<string>`split_part(split_part(${schema.articleLinks.href}, '#', 1), '?', 1)`;
  return db.select({ title: sql<string>`${schema.articles.published}->>'title'`, updatedAt: schema.articleLinks.updatedAt }).from(schema.articleLinks).innerJoin(schema.articles, eq(schema.articleLinks.articleId, schema.articles.id)).where(and(or(eq(schema.articleLinks.href, `entity:article:${id}`), urls.length ? inArray(href, urls) : undefined), eq(schema.articles.status, "published"))).limit(100);
}
/** Local route inspection only: never fetch an editor-supplied URL (no SSRF/crawler). */
export async function auditArticleLinks(draft: ArticleDraft) {
  const cta = { v: 1, doc: { type: "doc", content: draft.endCta ? [{ type: "cta", attrs: { id: "end-cta", href: draft.ctaHref } }] : [] } };
  const links = [...contentLinks(draft.content), ...contentLinks(cta)].slice(0, 100), hrefs = await entityHrefs([draft.content, cta]), base = await getSiteUrl();
  const distinct = [...new Set(links.map((l) => l.href))];
  const statuses = new Map<string, { resolved: string | null; warning: string }>();
  for (const href of distinct) {
    if (href.startsWith("entity:")) {
      const resolved = href.startsWith("entity:page:") ? SITE_PAGES[href.slice(12)]?.href : hrefs[href];
      statuses.set(href, { resolved: resolved ?? null, warning: resolved ? "" : "مقصد حذف‌شده یا منتشرنشده" }); continue;
    }
    let url: URL; try { url = new URL(href, base); } catch { statuses.set(href, { resolved: null, warning: "آدرس نامعتبر" }); continue; }
    if (url.origin !== new URL(base).origin) { statuses.set(href, { resolved: href, warning: "لینک بیرونی؛ درخواست شبکه برای بررسی ارسال نشده" }); continue; }
    let pathname: string;
    try { pathname = decodeURIComponent(url.pathname); } catch { statuses.set(href, { resolved: null, warning: "آدرس نامعتبر" }); continue; }
    const blog = /^\/blog\/([^/]+)$/.exec(pathname), service = /^\/services\/([^/]+)$/.exec(pathname);
    if (blog) {
      const route = await blogRoute(blog[1]);
      statuses.set(href, { resolved: route ? `/blog/${route.slug}` : null, warning: !route ? "مقصد بلاگ منتشرشده نیست" : route.redirect ? "نامک قدیمی؛ ریدایرکت دارد. اصلاح متن با تأیید مدیر" : "لینک دستی؛ برای پایداری از انتخاب‌گر داخلی استفاده کنید" });
    } else if (service) {
      const [row] = await db.select({ slug: schema.services.slug }).from(schema.services).where(and(eq(schema.services.slug, service[1]), eq(schema.services.published, true))).limit(1);
      statuses.set(href, { resolved: row ? href : null, warning: row ? "لینک دستی خدمت" : "خدمت حذف‌شده یا غیرفعال" });
    } else statuses.set(href, { resolved: href, warning: Object.values(SITE_PAGES).some((p) => p.href === url.pathname) ? "لینک دستی صفحه ثابت" : "مقصد دستی خارج از دامنه بررسی محلی" });
  }
  return links.map((l) => ({ ...l, ...statuses.get(l.href)! }));
}
