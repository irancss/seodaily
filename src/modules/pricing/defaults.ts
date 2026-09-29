// Starting structure of the calculators. Every price is 0 («توافقی») on purpose:
// the owner enters the real prices in the admin panel. Ids are fixed so a page
// rendered from the defaults matches the estimate the server recomputes.

import type { PricingConfig, PricingGroup, PricingOption, ServicePricing } from "./types";

const NOTE = "این برآورد اولیه است؛ قیمت نهایی پس از بررسی جزئیات پروژه اعلام می‌شود.";

function option(id: string, label: string, description = ""): PricingOption {
  return { id, label, price: 0, description };
}

function choice(
  id: string,
  type: "single" | "multi",
  title: string,
  options: PricingOption[],
  extra: Partial<Pick<PricingGroup, "help" | "required" | "perUnitOf">> = {},
): PricingGroup {
  return {
    id,
    type,
    title,
    help: extra.help ?? "",
    required: extra.required ?? false,
    options,
    perUnitOf: extra.perUnitOf ?? "",
    unitLabel: "",
    unitPrice: 0,
    min: 0,
    max: 10,
    defaultQty: 0,
  };
}

function quantity(
  id: string,
  title: string,
  { help = "", unitLabel, min, max, defaultQty }: Pick<PricingGroup, "unitLabel" | "min" | "max" | "defaultQty"> & { help?: string },
): PricingGroup {
  return { id, type: "quantity", title, help, required: false, options: [], perUnitOf: "", unitLabel, unitPrice: 0, min, max, defaultQty };
}

function webDesign(): ServicePricing {
  return {
    content: null,
    intro:
      "هزینه طراحی سایت به نوع سایت، سبک طراحی، تعداد صفحات و امکاناتی که نیاز دارید بستگی دارد. گزینه‌ها را انتخاب کنید تا برآورد اولیه را همین‌جا ببینید.",
    note: NOTE,
    plans: [],
    groups: [
      choice(
        "site-type",
        "single",
        "نوع سایت",
        [
          option("corporate", "سایت شرکتی", "معرفی شرکت، خدمات، نمونه‌کارها و راه‌های ارتباطی"),
          option("store", "فروشگاه اینترنتی", "فروش آنلاین با سبد خرید، درگاه پرداخت و مدیریت سفارش"),
          option("service", "سایت خدماتی", "معرفی خدمات و جذب درخواست مشاوره یا رزرو"),
          option("landing", "Landing Page", "یک صفحه متمرکز برای کمپین تبلیغاتی یا یک خدمت مشخص"),
        ],
        { required: true, help: "نوع سایت از هدف کسب‌وکار شما مشخص می‌شود." },
      ),
      choice(
        "design",
        "single",
        "سبک طراحی",
        [
          option("template", "قالب آماده با شخصی‌سازی", "راه‌اندازی سریع‌تر با هزینه کمتر"),
          option("custom", "طراحی اختصاصی رابط کاربری", "طراحی UI/UX مخصوص برند و مخاطبان شما"),
        ],
        { required: true },
      ),
      quantity("pages", "تعداد صفحات", {
        unitLabel: "صفحه",
        min: 1,
        max: 100,
        defaultQty: 5,
        help: "صفحه‌های اصلی سایت، مثل خانه، درباره ما، خدمات و تماس با ما.",
      }),
      choice("features", "multi", "امکانات و خدمات اضافه", [
        option("multilingual", "چندزبانه"),
        option("cms", "پنل مدیریت محتوا", "ویرایش متن‌ها، تصاویر و صفحات بدون نیاز به برنامه‌نویس"),
        option("payment", "درگاه پرداخت آنلاین"),
        option("booking", "رزرو و نوبت‌دهی آنلاین"),
        option("blog", "بلاگ و بخش مقالات"),
        option("sms", "اطلاع‌رسانی پیامکی"),
        option("seo-basics", "سئو پایه", "ساختار فنی، متادیتا و نقشه سایت برای شروعی درست در گوگل"),
        option("page-content", "تولید محتوای متنی صفحات"),
        option("hosting", "تهیه هاست و دامنه"),
      ]),
      choice("support", "single", "پشتیبانی پس از تحویل", [
        option("support-3", "۳ ماه پشتیبانی"),
        option("support-6", "۶ ماه پشتیبانی"),
        option("support-12", "۱۲ ماه پشتیبانی"),
      ]),
    ],
  };
}

function seo(): ServicePricing {
  return {
    content: null,
    intro:
      "هزینه سئو به وضعیت فعلی سایت، رقابتی بودن کلمات کلیدی و دامنه کار بستگی دارد. خدمات موردنیاز را انتخاب کنید تا برآورد اولیه را ببینید.",
    note: NOTE,
    plans: [],
    groups: [
      choice(
        "audit",
        "single",
        "ممیزی اولیه",
        [
          option("audit-basic", "ممیزی پایه", "بررسی ایندکس، خطاهای فنی مهم و وضعیت صفحه‌های اصلی"),
          option("audit-full", "ممیزی کامل", "بررسی فنی، محتوایی، ساختار لینک‌ها و رقبا با گزارش اولویت‌بندی‌شده"),
        ],
        { help: "بررسی وضعیت فعلی سایت، نقطه شروع هر برنامه سئو است." },
      ),
      choice("technical", "multi", "سئو تکنیکال", [
        option("crawl", "رفع خطاهای خزش و ایندکس"),
        option("speed", "بهبود سرعت و Core Web Vitals"),
        option("schema", "داده‌های ساختاریافته (Schema)"),
        option("structure", "بهینه‌سازی ساختار آدرس‌ها و لینک‌های داخلی"),
        option("mobile", "بهینه‌سازی نسخه موبایل"),
      ]),
      quantity("keywords", "تعداد کلمات کلیدی", {
        unitLabel: "کلمه کلیدی",
        min: 0,
        max: 200,
        defaultQty: 10,
        help: "کلمات کلیدی هدفی که برنامه سئو روی آن‌ها متمرکز می‌شود.",
      }),
      choice("on-page", "multi", "سئو داخلی و محتوا", [
        option("research", "تحقیق کلمات کلیدی و نقشه محتوا"),
        option("optimize", "بهینه‌سازی صفحه‌های موجود"),
        option("competitors", "تحلیل رقبا"),
        option("local", "سئو محلی و Google Business Profile"),
        option("links", "لینک‌سازی خارجی و رپورتاژ"),
      ]),
      choice("report", "single", "گزارش ماهانه", [
        option("report-summary", "گزارش خلاصه", "روند ورودی، رتبه‌ها و کارهای انجام‌شده"),
        option("report-full", "گزارش کامل و جلسه مرور", "گزارش تحلیلی همراه با جلسه ماهانه برای برنامه ماه بعد"),
      ]),
    ],
  };
}

function content(): ServicePricing {
  return {
    content: null,
    intro:
      "هزینه تولید محتوا بر اساس تعداد و طول مقاله‌ها و خدمات تکمیلی محاسبه می‌شود؛ قیمت طول مقاله و خدمات تکمیلی برای هر مقاله است.",
    note: NOTE,
    plans: [],
    groups: [
      quantity("articles", "تعداد مقاله", {
        unitLabel: "مقاله",
        min: 1,
        max: 200,
        defaultQty: 4,
      }),
      choice(
        "length",
        "single",
        "طول مقاله",
        [
          option("short", "کوتاه", "حدود ۸۰۰ کلمه"),
          option("medium", "متوسط", "حدود ۱۵۰۰ کلمه"),
          option("long", "بلند", "۲۵۰۰ کلمه و بیشتر"),
        ],
        { required: true, perUnitOf: "articles" },
      ),
      choice(
        "extras",
        "multi",
        "خدمات تکمیلی",
        [
          option("seo", "بهینه‌سازی سئو", "کلمه کلیدی، ساختار تیترها، متادیتا و لینک داخلی"),
          option("keyword", "تحقیق کلمه کلیدی"),
          option("image", "تصویر اختصاصی"),
          option("publish", "بارگذاری و انتشار در سایت"),
        ],
        { perUnitOf: "articles" },
      ),
    ],
  };
}

export function defaultServicePricing(service: keyof PricingConfig): ServicePricing {
  if (service === "seo") return seo();
  if (service === "content") return content();
  return webDesign();
}

export function defaultPricing(): PricingConfig {
  return { "web-design": webDesign(), seo: seo(), content: content() };
}
