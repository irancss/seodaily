import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
