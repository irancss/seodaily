// URL slugs for sections that share one address space per namespace
// (/plugins/{slug}; later /blog/{slug}). Pure functions, safe to import anywhere.

export const SLUG_NAMESPACES = ["plugins", "blog"] as const;
export type SlugNamespace = (typeof SLUG_NAMESPACES)[number];
export const SLUG_MAX_LENGTH = 80;

/** Words under /plugins/ that routes may use later; no plugin or category can take them (also enforced in the database). */
export const RESERVED_SLUGS: Record<SlugNamespace, readonly string[]> = {
  plugins: [
    "search",
    "download",
    "downloads",
    "preview",
    "admin",
    "updates",
    "feed",
    "rss",
    "page",
    "category",
    "categories",
    "api",
    "new",
    "sitemap",
    "themes",
  ],
  blog: ["search", "preview", "admin", "feed", "rss", "page", "category", "categories", "api", "new", "sitemap", "tag", "tags"],
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Canonical form of a slug typed by an admin or taken from a URL:
 * - Unicode NFC, Arabic ي/ك/ة/ۀ written as Persian ی/ک/ه, Persian/Arabic digits as 0-9
 * - Latin letters lower-cased; spaces, underscores and the zero-width non-joiner become "-"
 * - only a-z, 0-9, Persian letters and single inner hyphens remain; diacritics are dropped
 * Returns "" when nothing usable is left. Slashes, dots and percent signs never survive,
 * so a slug can never form a path ("..", "/", "%2f").
 */
export function normalizeSlug(input: string): string {
  let s = input.normalize("NFC").trim();
  s = s.replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").replace(/[ةۀ]/g, "ه").replace(/[أإٱ]/g, "ا").replace(/ؤ/g, "و");
  s = s.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d))).replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
  s = s.toLowerCase();
  // Arabic diacritics, tatweel and zero-width joiners carry no meaning in a URL.
  s = s.replace(/[ً-ٰٟـ‍‎‏]/g, "");
  s = s.replace(/[\s_‌]+/g, "-");
  s = s.replace(/[^a-z0-9ء-غف-يپچژکگیآ-]/g, "");
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (s.length > SLUG_MAX_LENGTH) s = s.slice(0, SLUG_MAX_LENGTH).replace(/-+$/, "");
  return s;
}

export function isReservedSlug(namespace: SlugNamespace, slug: string) {
  return RESERVED_SLUGS[namespace].includes(slug);
}

/**
 * The slug of a request path segment, or null when the segment is not a
 * canonical slug. Next.js decodes the segment once; anything still encoded
 * ("%2f", "%25…") or needing normalisation is not a canonical address.
 */
export function slugFromPath(segment: string): string | null {
  if (!segment || segment.includes("%") || segment.includes("/") || segment.includes("\\") || segment.includes("..")) return null;
  const slug = normalizeSlug(segment);
  return slug && slug === segment.normalize("NFC") ? slug : null;
}

/**
 * Like slugFromPath, but also accepts a non-canonical spelling of a valid slug
 * (upper case, Arabic letters, Persian digits) so the page can redirect to the
 * canonical URL. Encoded separators and dot segments are still rejected.
 */
export function looseSlugFromPath(segment: string): string | null {
  if (!segment || segment.includes("%") || segment.includes("/") || segment.includes("\\") || segment.includes("..")) return null;
  return normalizeSlug(segment) || null;
}
