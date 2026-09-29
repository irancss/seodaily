import { isSafeHref, isSafeImageSrc, type BlockNode } from "@/modules/blocks/schema";
import { documentText, nodeText } from "@/modules/blocks/text";
import { validateBlockDocument } from "@/modules/blocks/validate";
import { normalizeSlug } from "@/modules/slugs/normalize";
import { emptyArticle, type ArticleDraft } from "./types";

export function normalizeSearch(value: string) { return String(value).normalize("NFC").toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\s]+/g, " ").trim(); }
export function readableWords(content: ArticleDraft["content"]) {
  // Tables and code are readable; reusable CTA copy is excluded. A Persian ZWNJ stays inside a word.
  const text = (content.doc.content ?? []).filter((n) => n.type !== "cta").map(nodeText).join(" ");
  const words = text.match(/[\p{L}\p{N}]+(?:[‌'’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return words;
}
export function readingMinutes(content: ArticleDraft["content"], wordsPerMinute = 200) {
  return Math.max(1, Math.ceil(readableWords(content) / Math.max(50, wordsPerMinute)));
}
export function cleanText(value: unknown, max = 200) { return String(value ?? "").replace(/<[^>]*>/g, "").trim().slice(0, max); }
export function canonicalInput(value: unknown) {
  const input = String(value ?? "").trim();
  if (!input) return "";
  try { const url = new URL(input); if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error(); return url.href.replace(/\/$/, ""); }
  catch { throw new Error("canonical باید یک آدرس کامل http/https بدون query یا بخش خصوصی باشد."); }
}
export function parseArticle(raw: unknown): ArticleDraft {
  if (typeof raw === "string") {
    if (raw.length > 500_000) throw new Error("داده مقاله بیش از حد بزرگ است.");
    try { raw = JSON.parse(raw); } catch { throw new Error("ساختار مقاله معتبر نیست."); }
  }
  if (!raw || typeof raw !== "object" || JSON.stringify(raw).length > 500_000) throw new Error("داده مقاله معتبر نیست یا بیش از حد بزرگ است.");
  const v = raw as Record<string, unknown>;
  const result = emptyArticle();
  for (const key of ["title", "slug", "excerpt", "imageAlt", "seoTitle", "seoDescription", "ogTitle", "ogDescription", "ctaTitle", "ctaText", "ctaLabel"] as const) result[key] = cleanText(v[key], key === "excerpt" ? 1000 : 500);
  result.slug = normalizeSlug(result.slug);
  result.canonicalUrl = canonicalInput(v.canonicalUrl);
  for (const key of ["image", "ogImage"] as const) { const src = String(v[key] ?? ""); if (src && !isSafeImageSrc(src)) throw new Error("تصویر باید از رسانه‌های سایت انتخاب شود."); result[key] = src; }
  const doc = validateBlockDocument(v.content);
  if (!doc.document || doc.problems.length) throw new Error(doc.problems.join("؛ ") || "محتوا معتبر نیست.");
  result.content = doc.document;
  for (const key of ["categoryId", "primaryServiceId", "readingOverride"] as const) {
    const n = Number(v[key]); result[key] = Number.isSafeInteger(n) && n > 0 ? n : null;
  }
  if (result.readingOverride && result.readingOverride > 240) throw new Error("زمان مطالعه باید بین ۱ و ۲۴۰ دقیقه باشد.");
  for (const key of ["relatedIds", "serviceIds"] as const) result[key] = [...new Set((Array.isArray(v[key]) ? v[key] : []).map(Number).filter((n) => Number.isSafeInteger(n) && n > 0))].slice(0, 20);
  result.noindex = v.noindex === true; result.endCta = v.endCta === true; result.relatedMode = v.relatedMode === "manual" ? "manual" : "auto";
  result.ctaHref = String(v.ctaHref ?? "");
  if (result.ctaHref && !isSafeHref(result.ctaHref)) throw new Error("مقصد CTA معتبر نیست.");
  return result;
}
export function contentLinks(content: ArticleDraft["content"]) {
  const links: { blockId: string; href: string }[] = [];
  const visit = (n: BlockNode, blockId: string) => {
    for (const m of n.marks ?? []) if (m.type === "link" && m.attrs?.href) links.push({ blockId, href: String(m.attrs.href) });
    if (n.type === "cta" && n.attrs?.href) links.push({ blockId, href: String(n.attrs.href) });
    for (const child of n.content ?? []) visit(child, blockId);
  };
  for (const n of content.doc.content ?? []) visit(n, String(n.attrs?.id ?? ""));
  return links.slice(0, 2000);
}
export function publicationErrors(d: ArticleDraft) {
  return [!d.title && "عنوان الزامی است.", !d.slug && "نامک الزامی است.", !d.categoryId && "دسته اصلی الزامی است.", !d.image && "تصویر شاخص الزامی است.", !d.imageAlt && "متن جایگزین تصویر شاخص الزامی است.", documentText(d.content).trim().length < 20 && "محتوای معنادار مقاله را وارد کنید."].filter(Boolean) as string[];
}
/** Gregorian datetime-local explicitly interpreted in Tehran (UTC+03:30). */
export function tehranSchedule(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) throw new Error("زمان را با تقویم میلادی و ساعت تهران وارد کنید.");
  const date = new Date(`${input}:00+03:30`);
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime() + 3.5 * 3600_000).toISOString().slice(0, 16) !== input) throw new Error("تاریخ معتبر نیست.");
  return date;
}
