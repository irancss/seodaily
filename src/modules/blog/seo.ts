import type { Metadata } from "next";
import { buildMetadata } from "@/modules/seo/metadata";
import type { BlogSeo } from "./types";
export async function blogMetadata(data: BlogSeo, title: string, description: string, path: string, image = "", article = false, forceNoindex = false): Promise<Metadata> {
  const meta = await buildMetadata({ title: data.seoTitle || title, description: data.seoDescription || description, path: data.canonicalUrl || path, image: data.ogImage || image, type: article ? "article" : "website", noindex: forceNoindex || data.noindex });
  return { ...meta, openGraph: { ...meta.openGraph, title: data.ogTitle || data.seoTitle || title, description: data.ogDescription || data.seoDescription || description } };
}
export function selfCanonical(base: string, slug: string, canonical = "") { return !canonical || new URL(canonical).href === new URL(`/blog/${slug}`, base).href; }
