/** A sitemap contains only a page's own canonical URL, including its origin. */
export function isPluginSelfCanonical(base: string, slug: string, canonical: string): boolean {
  if (!canonical.trim()) return true;
  try {
    const own = new URL(`${base.replace(/\/+$/, "")}/plugins/${slug}`);
    return new URL(canonical.trim(), base).href === own.href;
  } catch {
    return false;
  }
}
