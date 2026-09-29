import { FaqList } from "@/components/organisms/faq-list";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BLOCK_DOC_VERSION, ENTITY_LINK_RE, SITE_PAGES, type BlockDocument, type BlockNode } from "@/modules/blocks/schema";
import { nodeText, outline } from "@/modules/blocks/text";
import { getSiteUrl } from "@/modules/seo/metadata";
import { contentHref } from "@/lib/content-links";

import { CopyCodeButton } from "./copy-code-button";

/** entity:plugin:12 → "/plugins/elementor-pro"; missing or unpublished → null (rendered as text). */
export type HrefMap = Record<string, string | null>;

type Ctx = { hrefs: HrefMap; anchors: Map<string, string>; imageIndex: { n: number }; priorityImages: number; siteUrl: string };

function resolveHref(href: string, hrefs: HrefMap): string | null {
  const m = ENTITY_LINK_RE.exec(href);
  if (!m) return href;
  if (m[1] === "page") return SITE_PAGES[m[2]]?.href ?? null;
  return hrefs[href] ?? null;
}

function SmartLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  if (/^https?:/i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow" className={className}>
        {children}
      </a>
    );
  }
  return <a href={href} className={className}>{children}</a>;
}

function inline(nodes: BlockNode[] | undefined, ctx: Ctx): ReactNode[] {
  return (nodes ?? []).map((n, i) => {
    if (n.type === "hardBreak") return <br key={i} />;
    let out: ReactNode = n.text ?? "";
    for (const mark of n.marks ?? []) {
      if (mark.type === "bold") out = <strong>{out}</strong>;
      else if (mark.type === "italic") out = <em>{out}</em>;
      else if (mark.type === "underline") out = <u>{out}</u>;
      else if (mark.type === "strike") out = <s>{out}</s>;
      else if (mark.type === "code") out = <code>{out}</code>;
      else if (mark.type === "link") {
        const resolved = resolveHref(String(mark.attrs?.href ?? ""), ctx.hrefs);
        const href = resolved ? contentHref(resolved, ctx.siteUrl) : null;
        if (href) out = <SmartLink href={href}>{out}</SmartLink>;
      }
    }
    return <span key={i}>{out}</span>;
  });
}

function blocks(nodes: BlockNode[] | undefined, ctx: Ctx): ReactNode[] {
  return (nodes ?? []).map((n, i) => block(n, ctx, i));
}

function block(n: BlockNode, ctx: Ctx, key: number): ReactNode {
  const a = n.attrs ?? {};
  switch (n.type) {
    case "paragraph":
      return <p key={key}>{inline(n.content, ctx)}</p>;
    case "heading": {
      const level = Math.min(4, Math.max(2, Number(a.level) || 2));
      const Tag = `h${level}` as "h2" | "h3" | "h4";
      return (
        <Tag key={key} id={ctx.anchors.get(String(a.id ?? ""))}>
          {inline(n.content, ctx)}
        </Tag>
      );
    }
    case "bulletList":
      return <ul key={key}>{blocks(n.content, ctx)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={Number(a.start) > 1 ? Number(a.start) : undefined}>
          {blocks(n.content, ctx)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{blocks(n.content, ctx)}</li>;
    case "blockquote":
      return <blockquote key={key}>{blocks(n.content, ctx)}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "codeBlock": {
      const code = (n.content ?? []).map((t) => t.text ?? "").join("");
      const language = String(a.language ?? "");
      return (
        <div key={key} className="block-code">
          <div className="block-code-bar">
            <span dir="ltr">{language || "code"}</span>
            <CopyCodeButton code={code} />
          </div>
          <pre dir="ltr" tabIndex={0}>
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    case "table": {
      const rows = n.content ?? [];
      const headerRows = rows.filter((r) => (r.content ?? []).every((c) => c.type === "tableHeader"));
      const bodyRows = rows.filter((r) => !headerRows.includes(r));
      const cells = (r: BlockNode) =>
        (r.content ?? []).map((c, j) => {
          const span = { colSpan: Number(c.attrs?.colspan) > 1 ? Number(c.attrs?.colspan) : undefined, rowSpan: Number(c.attrs?.rowspan) > 1 ? Number(c.attrs?.rowspan) : undefined };
          return c.type === "tableHeader" ? (
            <th key={j} scope="col" {...span}>{blocks(c.content, ctx)}</th>
          ) : (
            <td key={j} {...span}>{blocks(c.content, ctx)}</td>
          );
        });
      return (
        <div key={key} className="block-table" tabIndex={0} role="region" aria-label={String(a.caption || "جدول")}>
          <table>
            {a.caption ? <caption>{String(a.caption)}</caption> : null}
            {headerRows.length > 0 && <thead>{headerRows.map((r, j) => <tr key={j}>{cells(r)}</tr>)}</thead>}
            <tbody>{bodyRows.map((r, j) => <tr key={j}>{cells(r)}</tr>)}</tbody>
          </table>
        </div>
      );
    }
    case "figure": {
      const index = ctx.imageIndex.n++;
      const width = Number(a.width) || 1200;
      const height = Number(a.height) || Math.round(width * 0.5625);
      const ratio = String(a.ratio ?? "auto");
      return (
        <figure key={key} className="block-figure">
          <Image
            src={String(a.src)}
            alt={String(a.alt ?? "")}
            width={width}
            height={height}
            sizes="(min-width: 1024px) 760px, 100vw"
            priority={index < ctx.priorityImages}
            style={ratio !== "auto" ? { aspectRatio: ratio, objectFit: "cover" } : undefined}
          />
          {a.caption ? <figcaption>{String(a.caption)}</figcaption> : null}
        </figure>
      );
    }
    case "callout":
      return (
        <aside key={key} className={`block-callout block-callout-${String(a.tone ?? "info")}`} role="note">
          {blocks(n.content, ctx)}
        </aside>
      );
    case "faq":
      return (
        <FaqList key={key} items={(n.content ?? []).map((item) => ({ question: String(item.attrs?.question ?? ""), answer: blocks(item.content, ctx) }))} />
      );
    case "cta": {
      const resolved = resolveHref(String(a.href ?? ""), ctx.hrefs);
      const href = resolved ? contentHref(resolved, ctx.siteUrl) : null;
      return (
        <div key={key} className="block-cta">
          {a.title ? <p className="block-cta-title">{String(a.title)}</p> : null}
          {a.text ? <p>{String(a.text)}</p> : null}
          {href && (
            <SmartLink href={href} className="btn btn-primary h-11 px-5 text-[15px]">
              {String(a.label || "مشاهده")}
            </SmartLink>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

/**
 * Server-rendered block document. A document of an unknown version renders
 * nothing instead of failing the page. `anchorPrefix` keeps heading ids of
 * several documents on one page unique.
 */
export async function BlockRenderer({
  document,
  hrefs = {},
  anchorPrefix = "",
  priorityImages = 0,
  className = "",
  stableAnchors = false,
}: {
  document: BlockDocument | null | undefined;
  hrefs?: HrefMap;
  anchorPrefix?: string;
  priorityImages?: number;
  className?: string;
  stableAnchors?: boolean;
}) {
  if (!document || document.v !== BLOCK_DOC_VERSION || !Array.isArray(document.doc?.content)) return null;
  const anchors = new Map(outline(document, anchorPrefix, stableAnchors).map((o) => [o.blockId, o.anchor]));
  const ctx: Ctx = { hrefs, anchors, imageIndex: { n: 0 }, priorityImages, siteUrl: await getSiteUrl() };
  return <div className={`block-content ${className}`}>{blocks(document.doc.content, ctx)}</div>;
}

export function hasContent(document: BlockDocument | null | undefined) {
  return Boolean(document?.doc?.content?.some((n) => n.type === "figure" || n.type === "horizontalRule" || nodeText(n)));
}
