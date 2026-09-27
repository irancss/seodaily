import { MENU_LABEL_MAX, MENU_MAX_DEPTH, MENU_MAX_ITEMS, type MenuItem } from "./types";

/**
 * Makes a stored link safe to render: site paths, anchors, http(s), tel: and
 * mailto: are kept; a bare domain gets https://; anything else becomes a
 * site-relative path (so a "javascript:" value can never run).
 */
export function cleanMenuUrl(value: unknown): string {
  const url = String(value ?? "").trim().slice(0, 500);
  if (!url) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith("/") || url.startsWith("#")) return url;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/i.test(url)) return `https://${url}`;
  return `/${url.replace(/^\/+/, "")}`;
}

/**
 * Validates an untrusted menu tree (from the admin form or the database):
 * drops malformed entries, trims labels, enforces the depth and size limits
 * and gives every item a unique id.
 */
export function normalizeMenu(input: unknown): MenuItem[] {
  let count = 0;
  const seen = new Set<string>();

  function walk(nodes: unknown, depth: number): MenuItem[] {
    if (!Array.isArray(nodes) || depth > MENU_MAX_DEPTH) return [];
    const out: MenuItem[] = [];
    for (const node of nodes) {
      if (count >= MENU_MAX_ITEMS) break;
      if (!node || typeof node !== "object") continue;
      const raw = node as Record<string, unknown>;
      const label = String(raw.label ?? "").replace(/\s+/g, " ").trim().slice(0, MENU_LABEL_MAX);
      if (!label) continue;
      count++;
      let id = String(raw.id ?? "").replace(/[^\w-]/g, "").slice(0, 40);
      if (!id || seen.has(id)) id = `m${count}-${Math.random().toString(36).slice(2, 8)}`;
      seen.add(id);
      out.push({
        id,
        label,
        url: cleanMenuUrl(raw.url),
        ...(raw.newTab === true ? { newTab: true } : {}),
        children: walk(raw.children, depth + 1),
      });
    }
    return out;
  }

  return walk(input, 1);
}

/** Whether a menu link points at the current page (or one of its sub-pages). */
export function isMenuUrlActive(url: string, pathname: string) {
  if (!url.startsWith("/") || url.startsWith("//")) return false;
  const path = decodeURI(url.split(/[?#]/)[0] || "/");
  const current = decodeURI(pathname);
  if (path === "/") return current === "/";
  return current === path || current.startsWith(`${path}/`);
}

export function isMenuItemActive(item: MenuItem, pathname: string): boolean {
  return isMenuUrlActive(item.url, pathname) || item.children.some((child) => isMenuItemActive(child, pathname));
}
