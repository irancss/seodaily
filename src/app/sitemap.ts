import type { MetadataRoute } from "next";

import { getAllPublishedServices } from "@/modules/services/queries";
import { getPublishedProjects } from "@/modules/projects/queries";
import { projectHref } from "@/modules/projects/routes";
import { serviceHref } from "@/modules/services/routes";
import { getSiteUrl } from "@/modules/seo/metadata";

export const dynamic = "force-dynamic";

/**
 * Only canonical, indexable URLs that answer 200. lastmod is emitted only
 * where the database knows when the content really changed (services and
 * projects); changefreq/priority are left out because search engines ignore
 * them. The portfolio page is listed only once it has published projects —
 * until then it is noindex (see portfolio/page.tsx).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [base, services, projects] = await Promise.all([getSiteUrl(), getAllPublishedServices(), getPublishedProjects()]);

  const pages = ["/", "/web-design", "/seo", "/services", "/pricing", ...(projects.length > 0 ? ["/portfolio"] : []), "/about", "/contact"];
  const url = (path: string) => (path === "/" ? `${base}/` : `${base}${path}`);

  return [
    ...pages.map((path) => ({ url: url(path) })),
    ...services.map((s) => ({ url: url(serviceHref(s.slug)), lastModified: new Date(s.updatedAt) })),
    ...projects.map((p) => ({ url: url(projectHref(p.slug)), lastModified: new Date(p.updatedAt) })),
  ];
}
