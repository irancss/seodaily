import type { CSSProperties } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Inline CSS custom properties: `vars({ i: 2 })` → `--i: 2` (stagger index, sizes…). */
export function vars(values: Record<string, string | number>): CSSProperties {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [`--${key}`, value])) as CSSProperties;
}

/** Two-digit Persian-friendly step number (the font renders Farsi digits). */
export function stepNo(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

/** Route params arrive percent-encoded for non-ASCII (e.g. Persian) slugs. */
export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/** Persian (۰–۹) and Arabic (٠–٩) digits as Latin digits; everything else unchanged. */
export function toLatinDigits(value: string) {
  return value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Digits only (Persian/Arabic digits converted), keeping a leading +. */
export function phoneDigits(raw: string) {
  return toLatinDigits(raw).replace(/(?!^\+)[^\d]/g, "");
}

/** International form for tel: links and structured data (Iranian numbers get +98). */
export function phoneE164(raw: string) {
  const digits = phoneDigits(raw);
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length === 11) return `+98${digits.slice(1)}`;
  return digits;
}

/** Readable grouping, e.g. 0912 460 7630 (the site font renders Persian digits). */
export function formatPhone(raw: string) {
  const digits = phoneDigits(raw);
  if (/^09\d{9}$/.test(digits)) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  if (/^0\d{10}$/.test(digits)) return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  return raw.trim();
}

/** Title text without the *highlight* markers (for meta tags and structured data). */
export function plainText(text: string) {
  return text.replace(/\*([^*]+)\*/g, "$1");
}
