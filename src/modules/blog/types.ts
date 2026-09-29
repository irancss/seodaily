import { emptyDocument, type BlockDocument } from "@/modules/blocks/schema";

export type BlogSeo = { seoTitle: string; seoDescription: string; canonicalUrl: string; noindex: boolean; ogTitle: string; ogDescription: string; ogImage: string };
export type ArticleDraft = BlogSeo & {
  title: string; slug: string; excerpt: string; categoryId: number | null; content: BlockDocument;
  image: string; imageAlt: string; imageWidth: number; imageHeight: number;
  wordCount: number; readingOverride: number | null; primaryServiceId: number | null; serviceIds: number[];
  relatedMode: "auto" | "manual"; relatedIds: number[]; endCta: boolean;
  ctaTitle: string; ctaText: string; ctaLabel: string; ctaHref: string;
};
export type CategoryData = BlogSeo & { h1: string; description: string; image: string; imageAlt: string };
export const emptySeo = (): BlogSeo => ({ seoTitle: "", seoDescription: "", canonicalUrl: "", noindex: false, ogTitle: "", ogDescription: "", ogImage: "" });
export const emptyArticle = (): ArticleDraft => ({ ...emptySeo(), title: "", slug: "", excerpt: "", categoryId: null, content: emptyDocument(), image: "", imageAlt: "", imageWidth: 0, imageHeight: 0, wordCount: 0, readingOverride: null, primaryServiceId: null, serviceIds: [], relatedMode: "auto", relatedIds: [], endCta: false, ctaTitle: "", ctaText: "", ctaLabel: "", ctaHref: "" });
export const emptyCategory = (): CategoryData => ({ ...emptySeo(), h1: "", description: "", image: "", imageAlt: "" });
export const BLOG_DEFAULTS = { pageSize: 12, autoplayMs: 6000, wordsPerMinute: 200, relatedCount: 4 };
export type BlogOptions = typeof BLOG_DEFAULTS & { featuredId: number | null };
export const STATUS_LABELS: Record<string, string> = { draft: "پیش‌نویس", published: "منتشرشده", scheduled: "زمان‌بندی‌شده", archived: "آرشیو", trash: "زباله‌دان" };
