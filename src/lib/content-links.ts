/** Keep absolute links to this site's canonical origin as ordinary internal links. */
export function contentHref(href: string, siteUrl: string): string {
  if (!/^https?:\/\//i.test(href)) return href;
  try {
    const target = new URL(href);
    // A // path is legal in an absolute URL, but stripping its origin would turn
    // it into a protocol-relative link to a different host.
    if (!target.username && !target.password && !target.pathname.startsWith("//") && target.origin === new URL(siteUrl).origin) return `${target.pathname}${target.search}${target.hash}`;
  } catch { /* Invalid addresses are left to the content validator. */ }
  return href;
}
