// Version strings from source pages and plugin headers. Comparison is
// numeric per part ("1.10" > "1.9"); a string that does not look like a
// version is incomparable (null), never "highest" by string order.

const DIGITS: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** Pre-release labels in ascending order; anything else after the numbers is not understood. */
const PRE_LABELS = ["dev", "nightly", "alpha", "a", "beta", "b", "preview", "pre", "rc"] as const;
const PRE_RANK: Record<string, number> = { dev: 0, nightly: 0, alpha: 1, a: 1, beta: 2, b: 2, preview: 3, pre: 3, rc: 4 };

export type ParsedVersion = { parts: number[]; pre: { label: string; n: number } | null; text: string };

/** "v1.2.3", "۱.۲.۳", "Version 1.2" → "1.2.3" style text; "" when no version is present. */
export function cleanVersion(raw: string): string {
  const s = String(raw ?? "")
    .replace(/[۰-۹٠-٩]/g, (d) => DIGITS[d])
    .replace(/[‌‏‎]/g, "")
    .trim()
    .replace(/^(?:version|ver\.?|نسخه|ورژن)\s*[:：]?\s*/i, "")
    .replace(/^v(?=\d)/i, "");
  return s.length <= 40 ? s : "";
}

export function parseVersion(raw: string): ParsedVersion | null {
  const text = cleanVersion(raw);
  const m = /^(\d{1,6}(?:\.\d{1,6}){0,4})(?:[-_.+ ]?([a-z]+)[-_. ]?(\d{0,4}))?$/i.exec(text);
  if (!m) return null;
  const parts = m[1].split(".").map(Number);
  let pre: ParsedVersion["pre"] = null;
  if (m[2]) {
    const label = m[2].toLowerCase();
    if (!(PRE_LABELS as readonly string[]).includes(label)) return null;
    pre = { label, n: m[3] ? Number(m[3]) : 0 };
  }
  return { parts, pre, text };
}

export function isPrerelease(raw: string): boolean {
  return Boolean(parseVersion(raw)?.pre);
}

/** -1 / 0 / 1, or null when either side is not a version. */
export function compareVersions(a: string, b: string): number | null {
  const x = parseVersion(a);
  const y = parseVersion(b);
  if (!x || !y) return null;
  const len = Math.max(x.parts.length, y.parts.length);
  for (let i = 0; i < len; i++) {
    const d = (x.parts[i] ?? 0) - (y.parts[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  if (!x.pre && !y.pre) return 0;
  if (!x.pre) return 1; // 1.0 > 1.0-beta
  if (!y.pre) return -1;
  const r = PRE_RANK[x.pre.label] - PRE_RANK[y.pre.label];
  if (r !== 0) return r > 0 ? 1 : -1;
  return x.pre.n === y.pre.n ? 0 : x.pre.n > y.pre.n ? 1 : -1;
}

/** a is a newer version than b (false when either is incomparable). */
export function isNewer(a: string, b: string): boolean {
  return compareVersions(a, b) === 1;
}
