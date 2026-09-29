// Iranian mobile numbers only. Accepts 09xxxxxxxxx, 9xxxxxxxxx, +989…,
// 00989…, 989…, with Persian/Arabic digits, spaces, dashes or parentheses,
// and stores one canonical E.164 form (+989xxxxxxxxx). Operator prefixes are
// not hard-coded, so new ranges keep working.

const DIGITS: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function latinDigits(input: string) {
  return String(input ?? "").replace(/[۰-۹٠-٩]/g, (d) => DIGITS[d]);
}

export function normalizeIranMobile(input: string): string | null {
  let s = latinDigits(input).replace(/[\s\-().‌‎‏]/g, "");
  if (s.length > 20) return null;
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("00")) s = s.slice(2);
  if (s.startsWith("98")) s = s.slice(2);
  if (s.startsWith("0")) s = s.slice(1);
  return /^9\d{9}$/.test(s) ? `+98${s}` : null;
}

/** 0912***4567 — for screens that must not show the full number. */
export function maskPhone(e164: string) {
  const local = `0${e164.replace(/^\+98/, "")}`;
  return local.length === 11 ? `${local.slice(0, 4)}***${local.slice(-4)}` : "—";
}

/** 09121234567 — the local form SMS panels expect. */
export function localPhone(e164: string) {
  return `0${e164.replace(/^\+98/, "")}`;
}
