import "server-only";

import type { Metadata } from "next";

import { phoneE164, plainText } from "@/lib/utils";

import { getContact, getGeneral, getPageText } from "@/modules/settings/queries";
import { type PageKey } from "@/modules/settings/types";

/** Production origin used when neither the admin setting nor SITE_URL is set. */
const DEFAULT_SITE_URL = process.env.NODE_ENV === "production" ? "https://seodaily.ir" : "http://localhost:3000";

/**
 * Canonical origin for canonical links, sitemap, robots and structured data:
 * the admin «site URL» setting, else SITE_URL, else the production domain.
 */
export async function getSiteUrl() {
  const general = await getGeneral();
  let url = general.siteUrl.trim() || process.env.SITE_URL?.trim() || DEFAULT_SITE_URL;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, "");
}

export function absoluteUrl(base: string, path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type MetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
};

/**
 * Title, description, canonical URL, Open Graph and Twitter card for a page.
 * A title that already names the site is used as-is; otherwise the layout's
 * «… | سئو دیلی» template applies.
 */
export async function buildMetadata({ title: rawTitle, description, path, image, type = "website", noindex }: MetaInput): Promise<Metadata> {
  const [general, base] = await Promise.all([getGeneral(), getSiteUrl()]);
  // Editable titles may mark a highlighted word with *stars*.
  const title = plainText(rawTitle);
  const ogImage = image || general.ogImage;
  const fullTitle = title.includes(general.siteName) ? title : `${title} | ${general.siteName}`;
  const url = absoluteUrl(base, path);

  return {
    title: title.includes(general.siteName) ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: "fa_IR",
      siteName: general.siteName,
      url,
      title: fullTitle,
      description,
      ...(ogImage ? { images: [{ url: absoluteUrl(base, ogImage) }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      ...(ogImage ? { images: [absoluteUrl(base, ogImage)] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export async function pageMetadata(key: PageKey, path: string) {
  const text = await getPageText(key);
  return buildMetadata({
    title: text.metaTitle || text.title,
    description: text.metaDescription || text.subtitle,
    path,
  });
}

/** schema.org Organization + WebSite, rendered on every public page. */
export async function organizationJsonLd() {
  const [general, contact, base] = await Promise.all([getGeneral(), getContact(), getSiteUrl()]);
  return [
    {
      // Organization rather than a LocalBusiness type: there is no public
      // street address to publish, and LocalBusiness markup without one is
      // incomplete. Only values that exist in the settings are included.
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: general.siteName,
      description: general.footerDescription,
      url: `${base}/`,
      logo: absoluteUrl(base, "/icon.svg"),
      ...(general.ogImage ? { image: absoluteUrl(base, general.ogImage) } : {}),
      ...(contact.phone ? { telephone: phoneE164(contact.phone) } : {}),
      ...(contact.email ? { email: contact.email } : {}),
      ...(contact.address ? { address: contact.address } : {}),
      ...(contact.socials.length ? { sameAs: contact.socials.map((s) => s.url) } : {}),
      knowsLanguage: "fa",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: general.siteName,
      url: `${base}/`,
      inLanguage: "fa-IR",
      publisher: { "@id": `${base}/#organization` },
    },
  ];
}

export async function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const base = await getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(base, item.path),
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
