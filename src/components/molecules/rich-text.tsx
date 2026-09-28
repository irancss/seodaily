import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { cx } from "@/lib/utils";

const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** Inline text with `[anchor](/path)` links: site paths become <Link>, http(s) opens in a new tab, anything else stays text. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [whole, label, href] = m;
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (href.startsWith("/") && !href.startsWith("//")) {
      out.push(
        <Link key={at} href={href} className="font-medium text-brand-hover underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
          {label}
        </Link>,
      );
    } else if (/^https?:\/\//.test(href)) {
      out.push(
        <a key={at} href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-hover underline underline-offset-4">
          {label}
        </a>,
      );
    } else {
      out.push(whole);
    }
    last = at + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Plain-text content written in the admin, rendered safely (no HTML):
 * blank lines separate paragraphs, lines starting with «- » form a list and
 * `[anchor](/path)` makes a link.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className={cx("flex flex-col gap-4 text-base leading-[2] text-ink-2 lg:text-[17px]", className)}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const items = lines.filter((l) => /^[-•]\s+/.test(l));
        if (items.length > 0 && items.length === lines.length) {
          return (
            <ul key={i} className="flex flex-col gap-2.5">
              {items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.85em] size-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{inline(item.replace(/^[-•]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        // A paragraph, possibly followed by a list in the same block.
        const para = lines.filter((l) => !/^[-•]\s+/.test(l));
        return (
          <Fragment key={i}>
            <p>{inline(para.join(" "))}</p>
            {items.length > 0 && (
              <ul className="flex flex-col gap-2.5">
                {items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.85em] size-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{inline(item.replace(/^[-•]\s+/, ""))}</span>
                  </li>
                ))}
              </ul>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
