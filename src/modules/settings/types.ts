// Shapes of the settings stored in the `settings` table. Safe to import anywhere.

export type LinkItem = { title: string; url: string };

export type GeneralSettings = {
  siteName: string;
  siteUrl: string;
  footerDescription: string;
  footerNote: string;
  industries: LinkItem[];
  budgets: string[];
  techOptions: string[];
  /** Image used by link previews when a page has none of its own. */
  ogImage: string;
  /** Content of the google-site-verification meta tag. */
  googleVerification: string;
};

export type ContactSettings = {
  phone: string;
  email: string;
  address: string;
  socials: LinkItem[];
};

export type PageText = {
  badge: string;
  title: string;
  subtitle: string;
  ctaTitle: string;
  ctaText: string;
  metaTitle: string;
  metaDescription: string;
};

export const PAGE_KEYS = [
  "home",
  "services",
  "web-design",
  "seo",
  "portfolio",
  "about",
  "contact",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const PAGE_LABELS: Record<PageKey, string> = {
  home: "صفحه اصلی",
  services: "خدمات",
  "web-design": "طراحی سایت",
  seo: "سئو",
  portfolio: "نمونه‌کارها",
  about: "درباره ما",
  contact: "تماس با ما",
};
