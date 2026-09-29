// Display labels and small pure helpers of the plugin library. Safe anywhere.

export const PLUGIN_STATUS_LABEL: Record<string, string> = { draft: "پیش‌نویس", published: "منتشرشده", archived: "بایگانی" };
export const RELEASE_STATE_LABEL: Record<string, string> = {
  candidate: "در حال بررسی",
  review: "نیازمند بررسی مدیر",
  rejected: "ردشده",
  published: "منتشرشده",
  retired: "خارج از دانلود",
  withdrawn: "پس‌گرفته‌شده",
};
export const BLOCK_POSITION_LABEL: Record<string, string> = {
  before_download: "قبل از باکس دانلود",
  after_download: "بعد از باکس دانلود",
  page_end: "انتهای صفحه",
};
export const BLOCK_POSITIONS = ["before_download", "after_download", "page_end"] as const;
export const CHECK_LABEL: Record<string, string> = {
  validation: "ساختار ZIP و افزونه",
  identity: "هویت افزونه",
  version: "نسخه",
  scan: "اسکن بدافزار",
  sandbox: "آزمون نصب در وردپرس ایزوله",
  checksum: "Checksum رسمی WordPress.org",
};
/** Metadata fields an admin can type; typed values are never overwritten by a source. */
export const META_FIELDS = ["authorName", "authorUrl", "officialUrl", "license", "requiresWp", "requiresPhp", "testedUpTo", "originalName"] as const;
export type MetaField = (typeof META_FIELDS)[number];
export const META_FIELD_LABEL: Record<MetaField, string> = {
  originalName: "نام اصلی (انگلیسی)",
  authorName: "سازنده اصلی",
  authorUrl: "سایت سازنده",
  officialUrl: "صفحه رسمی افزونه",
  license: "مجوز (License)",
  requiresWp: "حداقل نسخه وردپرس",
  requiresPhp: "حداقل نسخه PHP",
  testedUpTo: "آزمایش‌شده تا وردپرس",
};

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString("fa-IR", { maximumFractionDigits: unit >= 2 ? 1 : 0 })} ${units[unit]}`;
}

export function publicDownloadCount(p: { baseDownloadCount: number; measuredDownloadCount: number }) {
  return Math.max(0, p.baseDownloadCount) + Math.max(0, p.measuredDownloadCount);
}

/** Calendar date in Tehran, e.g. «۶ مهر ۱۴۰۵». */
export function faDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium" }).format(new Date(value));
}

export function faNumber(n: number) {
  return n.toLocaleString("fa-IR");
}

export const CHECK_STATUS_LABEL: Record<string, string> = {
  PASS: "موفق",
  FAIL: "ناموفق",
  WARNING: "هشدار",
  UNAVAILABLE: "در دسترس نیست",
  NOT_APPLICABLE: "نامربوط",
  PENDING: "در انتظار",
};
export const CHECK_STATUS_TONE: Record<string, string> = {
  PASS: "bg-success-bg text-success",
  FAIL: "bg-error-bg text-error",
  WARNING: "bg-warning-bg text-warning",
  UNAVAILABLE: "bg-page text-ink-2 border border-line-strong",
  NOT_APPLICABLE: "bg-page text-muted",
  PENDING: "bg-page text-muted",
};
export const SOURCE_STATUS_LABEL: Record<string, string> = {
  ok: "خوانده شد",
  unchanged: "بدون تغییر",
  not_modified: "بدون تغییر (۳۰۴)",
  manual_setup_required: "نیازمند تنظیم دستی",
  error: "خطا",
  never: "هنوز بررسی نشده",
};
export const ADAPTER_LABEL: Record<string, string> = {
  auto: "تشخیص خودکار",
  wordpress_org: "WordPress.org (API رسمی)",
  github: "GitHub Releases",
  html: "صفحه وب (selector/نشانه‌ها)",
  direct: "لینک مستقیم فایل",
};
export const JOB_STATE_LABEL: Record<string, string> = { queued: "در صف", running: "در حال اجرا", done: "انجام شد", failed: "ناموفق", cancelled: "لغو شد" };
export const OUTCOME_LABEL: Record<string, string> = {
  updated: "به‌روز شد",
  up_to_date: "به‌روز است",
  review: "نسخه منتظر بررسی",
  partial: "بررسی ناقص (خطای بخشی از منابع)",
  failed: "ناموفق",
  manual_setup_required: "نیازمند تنظیم منبع",
  no_sources: "بدون منبع فعال",
  cancelled: "لغو شد",
};
