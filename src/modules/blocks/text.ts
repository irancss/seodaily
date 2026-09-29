// Plain text, heading outline (TOC anchors) and internal-link targets of a
// block document. The renderer uses the same outline, so TOC links always match.
import { normalizeSlug } from "@/modules/slugs/normalize";

import { ENTITY_LINK_RE, type BlockDocument, type BlockNode } from "./schema";

export function nodeText(node: BlockNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";
  const own = node.type === "faqItem" ? `${String(node.attrs?.question ?? "")} ` : node.type === "cta" ? `${String(node.attrs?.title ?? "")} ${String(node.attrs?.text ?? "")}` : "";
  const inner = (node.content ?? []).map(nodeText).join(isBlock(node) ? " " : "");
  return `${own}${inner}`.replace(/\s+/g, " ").trim();
}

function isBlock(node: BlockNode) {
  return node.type !== "paragraph" && node.type !== "heading" && node.type !== "text";
}

/** The whole document as one line of text (search index, meta description fallback). */
export function documentText(doc: BlockDocument | null | undefined, maxChars = 100_000): string {
  const blocks = doc?.doc?.content ?? [];
  return blocks.map(nodeText).filter(Boolean).join(" ").slice(0, maxChars);
}

export type OutlineEntry = { blockId: string; level: number; text: string; anchor: string };

/**
 * H2-H4 headings with unique anchors. `prefix` keeps anchors of other
 * documents on the same page (global blocks) from colliding with these.
 */
export function outline(doc: BlockDocument | null | undefined, prefix = "", stable = false): OutlineEntry[] {
  const used = new Set<string>();
  const out: OutlineEntry[] = [];
  for (const node of doc?.doc?.content ?? []) {
    if (node.type !== "heading") continue;
    const text = nodeText(node);
    if (!text) continue;
    const base = `${prefix}${stable && node.attrs?.id ? String(node.attrs.id) : normalizeSlug(text) || "section"}`;
    let anchor = base;
    for (let i = 2; used.has(anchor); i++) anchor = `${base}-${i}`;
    used.add(anchor);
    out.push({ blockId: String(node.attrs?.id ?? ""), level: Number(node.attrs?.level ?? 2), text, anchor });
  }
  return out;
}

/** Entities linked from the document (entity:plugin:12 …), to resolve to current URLs in one query. */
export function entityLinks(doc: BlockDocument | null | undefined): { type: string; id: string }[] {
  const found = new Map<string, { type: string; id: string }>();
  const visit = (node: BlockNode) => {
    const hrefs = [
      ...(node.marks ?? []).filter((m) => m.type === "link").map((m) => String(m.attrs?.href ?? "")),
      ...(node.type === "cta" ? [String(node.attrs?.href ?? "")] : []),
    ];
    for (const href of hrefs) {
      const m = ENTITY_LINK_RE.exec(href);
      if (m) found.set(href, { type: m[1], id: m[2] });
    }
    node.content?.forEach(visit);
  };
  doc?.doc?.content?.forEach(visit);
  return [...found.values()];
}
