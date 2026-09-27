import Link from "next/link";
import type { ReactNode } from "react";

import { Icon, IconTile } from "@/components/atoms";
import { cx } from "@/lib/utils";

type Props = {
  tone: "white" | "soft";
  icon: string;
  eyebrow: string;
  title: string;
  text: string;
  items: ReactNode[];
  link?: { href: string; label: string };
};

/** One half of the technical / content split, bleeding to the viewport edge on desktop. */
export function Half({ tone, icon, eyebrow, title, text, items, link }: Props) {
  return (
    <div
      className={cx(
        "flex flex-col items-start px-5 py-16 lg:py-24",
        tone === "white"
          ? "bg-white lg:border-l lg:border-line lg:pr-[max(20px,calc((100vw-1200px)/2))] lg:pl-16"
          : "border-t border-line bg-soft lg:border-t-0 lg:pr-16 lg:pl-[max(20px,calc((100vw-1200px)/2))]",
      )}
    >
      <span className="inline-flex items-center gap-3">
        <IconTile name={icon} size={44} iconSize={22} tone={tone === "white" ? "soft" : "white"} />
        <span dir="ltr" className="text-sm leading-[1.7] font-medium text-muted">
          {eyebrow}
        </span>
      </span>
      <h2 className="t-h2 mt-4 lg:mt-5">{title}</h2>
      <p className="body-lg mt-3 lg:mt-4">{text}</p>
      <ul className="mt-6 w-full border-t border-line lg:mt-8">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 border-b border-line py-3.5 text-base leading-[1.9] text-ink lg:items-center lg:gap-4 lg:py-4 lg:text-lg">
            <span
              aria-hidden="true"
              className={cx(
                "mt-[3px] flex size-6 shrink-0 items-center justify-center rounded-full text-brand lg:mt-0 lg:size-7",
                tone === "white" ? "bg-soft" : "bg-white",
              )}
            >
              <Icon name="check" size={16} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {link && (
        <Link href={link.href} className="text-link mt-5 lg:mt-8">
          {link.label}
          <Icon name="arrow-left" />
        </Link>
      )}
    </div>
  );
}
