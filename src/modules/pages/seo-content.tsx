import type { ReactNode } from "react";

/** Title, body and the card icon of each approach step. */
export const APPROACH: [string, string, string][] = [
  ["بررسی داده‌ها", "مرور داده‌های سرچ کنسول، آنالیتیکس و وضعیت فعلی صفحات سایت.", "bar-chart"],
  ["شناسایی مشکلات و فرصت‌ها", "پیدا کردن خطاهای فنی، کمبودهای محتوایی و موضوعاتی که هنوز پوشش داده نشده‌اند.", "search"],
  ["تعیین اولویت‌ها", "مرتب کردن کارها بر اساس اثر احتمالی، بودجه و زمان در دسترس.", "prioritize"],
  ["اجرا", "انجام اصلاحات فنی، محتوایی و ساختاری طبق اولویت‌های تعیین‌شده.", "zap"],
  ["اندازه‌گیری", "بررسی تغییرات بعد از اجرا با همان داده‌هایی که در شروع کار دیده شد.", "gauge"],
  ["بهبود", "اصلاح مسیر بر اساس نتایج و تعریف اولویت‌های دور بعد.", "cycle"],
];

export const TECHNICAL: ReactNode[] = [
  "ساختار و ایندکس‌پذیری صفحات",
  <>
    سرعت و <span dir="ltr">Core Web Vitals</span>
  </>,
  <>
    ساختار <span dir="ltr">URL</span> و لینک‌های داخلی
  </>,
  "داده‌های ساختاریافته",
  "خطاهای خزش و ریدایرکت‌ها",
];

export const CONTENT: string[] = [
  "تحقیق کلمات کلیدی و نیت جست‌وجو",
  "دسته‌بندی موضوعات و ارتباط صفحات",
  "بهینه‌سازی صفحات موجود",
  "برنامه تولید محتوا",
  "هماهنگی محتوا با مسیر فروش",
];

/** What shapes the pace and size of SEO results, with the icon shown beside each. */
export const FACTORS: { title: string; icon: string }[] = [
  { title: "وضعیت فعلی سایت", icon: "gauge" },
  { title: "رقابت بازار", icon: "compare" },
  { title: "منابع پروژه", icon: "layers" },
  { title: "سابقه دامنه", icon: "globe" },
];
