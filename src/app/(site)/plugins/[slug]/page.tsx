import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { JsonLd } from "@/components/atoms";
import { CategoryPageView } from "@/components/organisms/plugins/category-page-view";
import { DownloadBox } from "@/components/organisms/plugins/download-box";
import { PluginPageView } from "@/components/organisms/plugins/plugin-page-view";
import { decodeSlug } from "@/lib/utils";
import { documentText } from "@/modules/blocks/text";
import { faNumber } from "@/modules/plugins/labels";
import {
  entityHrefs,
  getPublishedCategory,
  getPublishedPlugin,
  listPublishedPlugins,
  publishedCategories,
  resolvePluginPath,
  type PublicPlugin,
} from "@/modules/plugins/queries";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, getSiteUrl } from "@/modules/seo/metadata";
import { looseSlugFromPath, slugFromPath } from "@/modules/slugs/normalize";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * /plugins/{slug} is a plugin or a category (one shared slug space). Old slugs
 * and non-canonical spellings answer with one 301 to the current URL; drafts,
 * archived items and unknown slugs are 404.
 */
async function resolve(raw: string) {
  const exact = slugFromPath(raw);
  const slug = exact ?? looseSlugFromPath(raw);
  if (!slug) return null;
  const hit = await resolvePluginPath(slug);
  if (!hit) return null;
  const id = hit.entityId;
  const target = hit.kind === "alias" ? hit.currentSlug : slug;
  if (hit.entityType === "plugin") {
    const plugin = await getPublishedPlugin(id);
    if (!plugin) return null;
    return hit.kind === "alias" || !exact ? ({ type: "redirect", to: target } as const) : ({ type: "plugin", plugin } as const);
  }
  if (hit.entityType === "plugin_category") {
    const category = await getPublishedCategory(id);
    if (!category) return null;
    return hit.kind === "alias" || !exact ? ({ type: "redirect", to: target } as const) : ({ type: "category", category } as const);
  }
  return null;
}

function pageNumber(sp: Record<string, string | string[] | undefined>) {
  const v = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  return Math.max(1, Number.parseInt(v ?? "", 10) || 1);
}

/** Only a site path or an http(s) URL may replace the default canonical. */
function canonicalPath(plugin: PublicPlugin) {
  const c = plugin.canonicalUrl.trim();
  if (c.startsWith("/") && !c.startsWith("//")) return c;
  if (/^https?:\/\/[^\s]+$/i.test(c)) return c;
  return `/plugins/${plugin.slug}`;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const page = await resolve(decodeSlug((await params).slug));
  if (!page || page.type === "redirect") return {};
  if (page.type === "plugin") {
    const p = page.plugin;
    const meta = await buildMetadata({
      title: p.seoTitle || `دانلود افزونه ${p.name}`,
      description: p.seoDescription || p.excerpt || documentText(p.content, 160),
      path: canonicalPath(p),
      image: p.ogImage || p.iconUrl,
      noindex: p.noindex,
    });
    return p.noindex ? { ...meta, robots: { index: false, follow: true } } : meta;
  }
  const c = page.category;
  const n = pageNumber(await searchParams);
  const list = await listPublishedPlugins({ categoryId: c.id, page: n });
  const path = list.page > 1 ? `/plugins/${c.slug}?page=${list.page}` : `/plugins/${c.slug}`;
  const meta = await buildMetadata({
    title: `${c.seoTitle || c.title}${list.page > 1 ? ` – صفحه ${faNumber(list.page)}` : ""}`,
    description: c.seoDescription || documentText(c.description, 160) || `افزونه‌های وردپرس دسته ${c.title}`,
    path,
    image: c.imageUrl,
  });
  // A category without published plugins is reachable but not indexed.
  return list.total === 0 ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function PluginOrCategoryPage({ params, searchParams }: Props) {
  const page = await resolve(decodeSlug((await params).slug));
  if (!page) notFound();
  if (page.type === "redirect") {
    const n = pageNumber(await searchParams);
    permanentRedirect(`/plugins/${encodeURIComponent(page.to)}${n > 1 ? `?page=${n}` : ""}`);
  }

  if (page.type === "category") {
    const c = page.category;
    const n = pageNumber(await searchParams);
    const [list, categories, hrefs] = await Promise.all([
      listPublishedPlugins({ categoryId: c.id, page: n }),
      publishedCategories(),
      entityHrefs([c.description]),
    ]);
    if (n > list.pages) notFound();
    return (
      <>
        <CategoryPageView category={c} list={list} categories={categories} hrefs={hrefs} />
        <JsonLd
          data={await breadcrumbJsonLd([
            { name: "صفحه اصلی", path: "/" },
            { name: "افزونه‌های وردپرس", path: "/plugins" },
            { name: c.title, path: `/plugins/${c.slug}` },
          ])}
        />
      </>
    );
  }

  const p = page.plugin;
  const [hrefs, base] = await Promise.all([entityHrefs([p.content, ...p.blocks.map((b) => b.content)]), getSiteUrl()]);
  const current = p.releases.find((r) => r.current) ?? p.releases[0];
  const url = absoluteUrl(base, `/plugins/${p.slug}`);
  const modified = [p.publishedAt, p.contentUpdatedAt, p.packageUpdatedAt].filter((d): d is string => Boolean(d)).sort().at(-1);
  // Facts only: the original author, no invented rating, price or review.
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.originalName || p.name,
    ...(p.originalName && p.originalName !== p.name ? { alternateName: p.name } : {}),
    applicationCategory: "WebApplication",
    applicationSubCategory: "WordPress Plugin",
    operatingSystem: "WordPress",
    url,
    description: p.seoDescription || p.excerpt,
    ...(p.iconUrl ? { image: absoluteUrl(base, p.iconUrl) } : {}),
    ...(current ? { softwareVersion: current.version, fileSize: `${Math.ceil(current.bytes / 1024)}KB` } : {}),
    ...(p.requiresWp ? { softwareRequirements: `WordPress ${p.requiresWp}+` } : {}),
    ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
    ...(modified ? { dateModified: modified } : {}),
    ...(p.authorName ? { author: { "@type": "Organization", name: p.authorName, ...(p.authorUrl ? { url: p.authorUrl } : {}) } } : {}),
    ...(p.license ? { license: p.license } : {}),
  };

  return (
    <>
      <PluginPageView plugin={p} hrefs={hrefs} download={<DownloadBox releases={p.releases} />} />
      <JsonLd data={softwareLd} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: p.seoTitle || p.name,
          url,
          inLanguage: "fa-IR",
          ...(modified ? { dateModified: modified } : {}),
          publisher: { "@id": `${base}/#organization` },
        }}
      />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "افزونه‌های وردپرس", path: "/plugins" },
          ...(p.primaryCategory ? [{ name: p.primaryCategory.title, path: `/plugins/${p.primaryCategory.slug}` }] : []),
          { name: p.name, path: `/plugins/${p.slug}` },
        ])}
      />
    </>
  );
}
