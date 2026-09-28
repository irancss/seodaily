import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/modules/seo/metadata";

export const dynamic = "force-dynamic";

// Public pages and their assets stay crawlable; only the admin panel is kept
// out (its pages also send noindex and require a login). Google ignores the
// old «Host» directive, so it is not emitted.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl();
  return {
    rules: [{ userAgent: "*", disallow: "/admin" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
