import type { MetadataRoute } from "next";

import { getAllPublishedServices } from "@/modules/services/queries";
import { publishedCategories, sitemapPlugins } from "@/modules/plugins/queries";
import { getPublishedProjects } from "@/modules/projects/queries";
import { projectHref } from "@/modules/projects/routes";
import { serviceHref } from "@/modules/services/routes";
import { getSiteUrl } from "@/modules/seo/metadata";

export const dynamic = "force-dynamic";

/**
 * Only canonical, indexable URLs that answer 200. lastmod is emitted only
 * where the database knows when the content really changed (services,
 * projects and plugins); changefreq/priority are left out because search engines ignore
 * them. The portfolio page is listed only once it has published projects —
 * until then it is noindex (see portfolio/page.tsx).
 */
function lastmod(dates: (string | null)[]) {
  const latest = dates.filter((d): d is string => Boolean(d)).sort().at(-1);
  return latest ? { lastModified: new Date(latest) } : {};
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [base, services, projects, plugins, categories] = await Promise.all([
    getSiteUrl(),
    getAllPublishedServices(),
    getPublishedProjects(),
    sitemapPlugins(),
    publishedCategories(),
  ]);

  const pages = ["/", "/web-design", "/seo", "/services", "/pricing", ...(projects.length > 0 ? ["/portfolio"] : []), "/about", "/contact"];
  const url = (path: string) => (path === "/" ? base : `${base}${path}`);
  const ownCanonical = (canonical: string, slug: string) => {
    try { return !canonical || new URL(canonical, base).href === url(`/plugins/${slug}`); }
    catch { return false; }
  };

  return [
    ...pages.map((path) => ({ url: url(path) })),
    ...services.map((s) => ({ url: url(serviceHref(s.slug)), lastModified: new Date(s.updatedAt) })),
    ...projects.map((p) => ({ url: url(projectHref(p.slug)), lastModified: new Date(p.updatedAt) })),
    // The plugin library is listed once it has published plugins; categories only with published plugins.
    ...(plugins.length > 0 ? [{ url: url("/plugins"), ...lastmod(plugins.map((p) => p.updatedAt)) }] : []),
    ...categories.filter((c) => !c.noindex && ownCanonical(c.canonicalUrl, c.slug)).map((c) => ({ url: url(`/plugins/${c.slug}`), ...lastmod([c.updatedAt]) })),
    ...plugins.map((p) => ({ url: url(`/plugins/${p.slug}`), ...lastmod([p.updatedAt]) })),
  ];
}
