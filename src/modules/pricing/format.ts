import { phoneDigits } from "@/lib/utils";

const numberFormat = new Intl.NumberFormat("fa-IR");

/** Persian digits with thousands separators, e.g. ۱۵٬۰۰۰٬۰۰۰. */
export function formatNumber(n: number) {
  return numberFormat.format(n);
}

/** A single price: «۱۲٬۰۰۰٬۰۰۰ تومان», or «توافقی» for 0. */
export function formatPrice(n: number) {
  return n > 0 ? `${formatNumber(n)} تومان` : "توافقی";
}

/** An estimate total; nothing priced yet reads «برآورد پس از بررسی». */
export function formatTotal(n: number) {
  return n > 0 ? `${formatNumber(n)} تومان` : "برآورد پس از بررسی";
}

/** A whole number typed by a person (Persian digits and separators allowed), or null. */
export function parseDigits(value: string) {
  const digits = phoneDigits(value).replace(/\D/g, "").slice(0, 15);
  return digits ? Number.parseInt(digits, 10) : null;
}

/** A typed toman amount; empty means 0. */
export function parseAmount(value: string) {
  return parseDigits(value) ?? 0;
}
