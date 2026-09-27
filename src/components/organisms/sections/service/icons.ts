import type { IconName } from "@/components/atoms";

export const PROBLEM_ICONS: IconName[] = ["alert", "question", "layers", "search-minus", "gauge"];
export const DELIVERABLE_ICONS: IconName[] = ["doc-lines", "doc-check", "list-doc", "folder"];
/** Fallback cycle for «includes» items whose text gives no hint. */
export const INCLUDE_ICONS: IconName[] = ["check-circle", "layers", "target", "sparkle", "zap", "shield"];

/**
 * Keyword hints for list items typed in the admin panel (first match wins), so
 * a card about speed gets a gauge and one about keywords a magnifier.
 */
const HINTS: [RegExp, IconName][] = [
  [/سرعت|بارگذاری|core web vitals|lcp|کارایی/i, "gauge"],
  [/موبایل|ریسپانسیو|واکنش‌گرا|responsive/i, "responsive"],
  [/کلمات? کلیدی|کلیدواژه|keyword/i, "search"],
  [/رقبا|رقیب|مقایسه/, "compare"],
  [/ایندکس|خزش|اسکیما|schema|تکنیکال|فنی|technical/i, "code"],
  [/ساختار|معماری|نقشه سایت|sitemap|آدرس|url/i, "sitemap"],
  [/لینک/, "share"],
  [/گزارش|آمار|داده|آنالیتیکس|analytics|سرچ کنسول|search console|پایش/i, "bar-chart"],
  [/محتوا|مقاله|متن|نگارش/, "pen"],
  [/طراحی|رابط کاربری|ظاهر|\bui\b|\bux\b/i, "palette"],
  [/امنیت|ssl|پشتیبان/i, "shield"],
  [/پنل|مدیریت/, "settings"],
  [/محصول|فروش|سبد|سفارش|پرداخت|فروشگاه/, "bag"],
  [/فرم|تماس|مشاوره|پیام/, "message"],
  [/کاربر|مخاطب|مشتری/, "users"],
  [/جست‌?و?جو|گوگل|google|serp/i, "search"],
  [/رشد|بهبود|افزایش/, "trending-up"],
  [/هدف|تبدیل|کمپین/, "target"],
  [/زبان|بین‌المللی/, "globe"],
];

/** Icon for a free-text item: a keyword hint, otherwise the next one in `fallback`. */
export function pickIcon(text: string, index: number, fallback: IconName[]): IconName {
  return HINTS.find(([pattern]) => pattern.test(text))?.[1] ?? fallback[index % fallback.length];
}
