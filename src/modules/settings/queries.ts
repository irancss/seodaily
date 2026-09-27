import "server-only";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

import { cached } from "@/lib/cache";

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

export const DEFAULT_GENERAL: GeneralSettings = {
  siteName: "سئو دیلی",
  siteUrl: "",
  footerDescription:
    "طراحی سایت و سئو برای کسب‌وکارهایی که می‌خواهند حضور آنلاین خود را اصولی و قابل توسعه بسازند.",
  footerNote: "طراحی سایت و سئو",
  industries: [
    "فروشگاه اینترنتی",
    "شرکت‌ها",
    "کسب‌وکارهای خدماتی",
    "پزشکی و زیبایی",
    "املاک",
    "رستوران و کافه",
    "طلا و جواهر",
    "آموزشی",
  ].map((title) => ({ title, url: "/contact" })),
  budgets: [],
  techOptions: ["وردپرس", "ووکامرس", "توسعه اختصاصی"],
  ogImage: "",
  googleVerification: "",
};

export const DEFAULT_CONTACT: ContactSettings = {
  phone: "",
  email: "",
  address: "",
  socials: [],
};

export const DEFAULT_PAGES: Record<PageKey, PageText> = {
  home: {
    badge: "طراحی سایت و سئو",
    title: "حضور آنلاین کسب‌وکارت را اصولی بساز",
    subtitle:
      "از طراحی یک وب‌سایت حرفه‌ای تا برنامه‌ریزی و اجرای سئو، کمکت می‌کنیم زیرساخت دیجیتال کسب‌وکارت را طوری بسازی که هم برای کاربر قابل اعتماد باشد و هم برای موتورهای جست‌وجو ساختار درستی داشته باشد.",
    ctaTitle: "برای شروع، اول درباره پروژه صحبت کنیم",
    ctaText:
      "اگر هنوز مطمئن نیستید چه خدمتی برای کسب‌وکارتان مناسب‌تر است، اطلاعات اولیه پروژه را ارسال کنید تا شرایط آن بررسی شود.",
    metaTitle: "سئو دیلی — طراحی سایت و سئو",
    metaDescription:
      "طراحی سایت شرکتی، فروشگاهی و خدماتی و خدمات سئو برای کسب‌وکارهایی که می‌خواهند حضور آنلاین خود را اصولی و قابل توسعه بسازند.",
  },
  services: {
    badge: "طراحی سایت و سئو",
    title: "خدمات سئو دیلی",
    subtitle:
      "از طراحی زیرساخت وب تا بهینه‌سازی برای موتورهای جست‌وجو، خدمات را بر اساس مرحله‌ای که کسب‌وکار شما در آن قرار دارد انتخاب می‌کنیم.",
    ctaTitle: "مسیر مناسب را با هم مشخص کنیم",
    ctaText:
      "اگر بین طراحی سایت، بازطراحی یا سئو مردد هستید، اطلاعات اولیه پروژه را بفرستید تا بعد از بررسی، مسیر مناسب پیشنهاد شود.",
    metaTitle: "خدمات طراحی سایت و سئو",
    metaDescription:
      "خدمات طراحی سایت و سئو سئو دیلی؛ مسیر مناسب را بر اساس وضعیت فعلی کسب‌وکار و سایت انتخاب کنید.",
  },
  "web-design": {
    badge: "خدمات طراحی سایت",
    title: "طراحی سایت متناسب با کسب‌وکار شما",
    subtitle:
      "سایتی که فقط زیبا نباشد؛ سریع، قابل توسعه، قابل مدیریت و متناسب با مسیر واقعی کاربر طراحی شود.",
    ctaTitle: "برای طراحی سایت، از شناخت کسب‌وکار شروع کنیم",
    ctaText:
      "اطلاعات اولیه کسب‌وکار و نیازتان را ارسال کنید تا نوع سایت و مسیر مناسب پروژه با هم بررسی شود.",
    metaTitle: "طراحی سایت",
    metaDescription:
      "طراحی سایت شرکتی، فروشگاه اینترنتی، سایت خدماتی و Landing Page؛ سریع، قابل توسعه و قابل مدیریت.",
  },
  seo: {
    badge: "خدمات SEO",
    title: "سئو؛ از بررسی وضعیت فعلی تا رشد ساختاری سایت",
    subtitle:
      "قبل از تولید محتوا یا لینک‌سازی، باید بدانیم سایت الان کجاست، چه مشکلاتی دارد و چه فرصت‌هایی برای رشد وجود دارد.",
    ctaTitle: "اول وضعیت فعلی سایت را بررسی کنیم",
    ctaText:
      "آدرس سایت و توضیح کوتاهی از کسب‌وکارتان را بفرستید تا وضعیت فعلی بررسی شود و درباره قدم‌های بعدی صحبت کنیم.",
    metaTitle: "خدمات سئو",
    metaDescription:
      "ممیزی سئو، سئو تکنیکال، تحقیق کلمات کلیدی و استراتژی محتوا؛ سئو بر اساس داده و وضعیت واقعی سایت.",
  },
  portfolio: {
    badge: "طراحی سایت و فعالیت‌های دیجیتال",
    title: "نمونه‌کارها",
    subtitle:
      "منتخبی از پروژه‌های طراحی سایت و فعالیت‌های دیجیتال که برای کسب‌وکارهای مختلف انجام شده‌اند.",
    ctaTitle: "پروژه‌ای در ذهن دارید؟",
    ctaText: "اطلاعات اولیه پروژه را برای ما بفرستید تا نیازها و شرایط آن بررسی شود.",
    metaTitle: "نمونه‌کارها",
    metaDescription: "نمونه‌کارهای طراحی سایت و فعالیت‌های دیجیتال سئو دیلی.",
  },
  about: {
    badge: "درباره سئو دیلی",
    title: "سایت و سئو را به‌عنوان یک سیستم واحد می‌بینیم",
    subtitle:
      "یک وب‌سایت خوب فقط مجموعه‌ای از صفحات زیبا نیست. طراحی، محتوا، ساختار فنی و مسیر کاربر باید کنار هم کار کنند.",
    ctaTitle: "اگر به همین نگاه برای پروژه‌تان نیاز دارید، صحبت کنیم",
    ctaText:
      "اطلاعات اولیه پروژه را بفرستید تا نیاز آن بررسی شود و درباره مسیر مناسب با هم صحبت کنیم.",
    metaTitle: "درباره ما",
    metaDescription: "سئو دیلی سایت و سئو را به‌عنوان یک سیستم واحد می‌بیند.",
  },
  contact: {
    badge: "شروع همکاری",
    title: "درباره پروژه‌ات با ما صحبت کن",
    subtitle:
      "چند اطلاعات اولیه درباره کسب‌وکار و نیازت ارسال کن تا مسیر مناسب برای ادامه پروژه مشخص شود.",
    ctaTitle: "راه‌های ارتباطی",
    ctaText: "اگر ترجیح می‌دهید، می‌توانید از این راه‌ها هم با ما در ارتباط باشید.",
    metaTitle: "تماس و درخواست مشاوره",
    metaDescription: "فرم درخواست مشاوره طراحی سایت و سئو.",
  },
};

async function readSetting<T extends object>(key: string, defaults: T): Promise<T> {
  // No try/catch: a failed read must not be cached as "defaults".
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, key) });
  if (!row) return defaults;
  return { ...defaults, ...(row.value as Partial<T>) };
}

export async function writeSetting(key: string, value: unknown) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
}

export const getGeneral = cached(() => readSetting("general", DEFAULT_GENERAL), "settings:general");
export const getContact = cached(() => readSetting("contact", DEFAULT_CONTACT), "settings:contact");

export const getPageTexts = cached(async () => {
  const stored = await readSetting<Partial<Record<PageKey, Partial<PageText>>>>("pages", {});
  const result = {} as Record<PageKey, PageText>;
  for (const key of PAGE_KEYS) {
    const merged = { ...DEFAULT_PAGES[key] };
    for (const [field, value] of Object.entries(stored[key] ?? {})) {
      // An emptied field in the admin falls back to the design's text.
      if (typeof value === "string" && value.trim()) merged[field as keyof PageText] = value;
    }
    result[key] = merged;
  }
  return result;
}, "settings:pages");

export async function getPageText(key: PageKey) {
  return (await getPageTexts())[key];
}
