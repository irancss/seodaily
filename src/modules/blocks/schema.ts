// The block-document contract shared by the admin editor (TipTap), the server
// validator, the public renderer and text/TOC extraction. Pure: safe anywhere.
//
// Stored as { v: 1, doc } where doc is a TipTap/ProseMirror JSON document
// restricted to the node and mark types below. Every top-level block has a
// stable attrs.id.

export const BLOCK_DOC_VERSION = 1;

export type Mark = { type: string; attrs?: Record<string, unknown> };
export type BlockNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: BlockNode[];
  text?: string;
  marks?: Mark[];
};
export type BlockDocument = { v: number; doc: BlockNode };

export const LIMITS = {
  topLevelBlocks: 400,
  textChars: 80_000,
  depth: 8,
  tableRows: 40,
  tableCols: 10,
  attrChars: 500,
  codeChars: 20_000,
  /** Largest paste the editor accepts, in characters of HTML. */
  pasteChars: 200_000,
};

export const CALLOUT_TONES = ["info", "warning", "success"] as const;
export const CODE_LANGUAGES = ["", "php", "js", "ts", "css", "html", "json", "bash", "sql", "text"] as const;

/** Nodes allowed at each position; anything else is dropped by the validator. */
export const TOP_LEVEL = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "table",
  "figure",
  "callout",
  "faq",
  "cta",
] as const;

export const MARKS = ["bold", "italic", "underline", "strike", "code", "link"] as const;

/**
 * Link targets. Internal links store the entity, not the URL, so a renamed
 * page keeps its links: "entity:plugin:12", "entity:plugin_category:3",
 * "entity:page:contact" (fixed site pages).
 */
export const ENTITY_LINK_RE = /^entity:(plugin|plugin_category|article|blog_category|service|page):([a-z0-9-]{1,40})$/;
export const SITE_PAGES: Record<string, { href: string; label: string }> = {
  home: { href: "/", label: "صفحه اصلی" },
  blog: { href: "/blog", label: "بلاگ" },
  contact: { href: "/contact", label: "تماس و درخواست مشاوره" },
  pricing: { href: "/pricing", label: "تعرفه‌ها" },
  services: { href: "/services", label: "خدمات" },
  "web-design": { href: "/web-design", label: "طراحی سایت" },
  seo: { href: "/seo", label: "سئو" },
  plugins: { href: "/plugins", label: "کتابخانه افزونه‌ها" },
  about: { href: "/about", label: "درباره ما" },
};

/** http(s), mailto, tel, site-relative paths and entity links. No javascript:, data:, protocol-relative. */
export function isSafeHref(href: string): boolean {
  // URL parsing forgives surrounding spaces and control characters; a stored href must not need that.
   
  if (href.length > LIMITS.attrChars || /[\s\u0000-\u001F\u007F]/.test(href)) return false;
  if (ENTITY_LINK_RE.test(href)) return true;
  if (/^\/(?!\/)[^\s<>"'\\]*$/.test(href)) return true;
  if (/^(mailto|tel):[^\s<>"'\\]+$/i.test(href)) return true;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Image sources: uploaded files only (the site's own /uploads). */
export function isSafeImageSrc(src: string): boolean {
  return /^\/uploads\/[a-z0-9]{4,16}-[a-f0-9]{16}\.(jpg|png|webp|avif|gif)$/.test(src);
}

export function emptyDocument(): BlockDocument {
  return { v: BLOCK_DOC_VERSION, doc: { type: "doc", content: [] } };
}
