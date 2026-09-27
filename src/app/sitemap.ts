import type { MetadataRoute } from "next";

import { getAllPublishedServices } from "@/modules/services/queries";
import { getPublishedProjects } from "@/modules/projects/queries";
import { projectHref } from "@/modules/projects/routes";
import { serviceHref } from "@/modules/services/routes";
import { getSiteUrl } from "@/modules/seo/metadata";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [base, services, projects] = await Promise.all([getSiteUrl(), getAllPublishedServices(), getPublishedProjects()]);

  const pages: [string, number][] = [
    ["/", 1],
    ["/services", 0.9],
    ["/web-design", 0.9],
    ["/seo", 0.9],
    ["/portfolio", 0.8],
    ["/about", 0.6],
    ["/contact", 0.7],
  ];

  return [
    ...pages.map(([path, priority]) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority })),
    ...services.map((s) => ({
      url: `${base}${serviceHref(s.slug)}`,
      lastModified: new Date(s.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...projects.map((p) => ({
      url: `${base}${projectHref(p.slug)}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
