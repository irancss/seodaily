import type { ReactNode } from "react";

import { ButtonLink, Icon, IconTile } from "@/components/atoms";
import { cx, vars } from "@/lib/utils";

type Props = {
  tone: "dark" | "light";
  icon: string;
  eyebrow: string;
  title: string;
  text: string;
  items: ReactNode[];
  link?: { href: string; label: string };
};

/** One panel of the technical / content split: `dark` on the navy surface, `light` as a white card. */
export function Half({ tone, icon, eyebrow, title, text, items, link }: Props) {
  const dark = tone === "dark";
  return (
    <div
      className={cx(
        "reveal flex flex-col items-start rounded-xl p-6 sm:p-8 lg:rounded-2xl lg:p-12",
        dark ? "surface-dark overflow-hidden" : "border border-line bg-white shadow-md",
      )}
      style={vars({ i: dark ? 0 : 1 })}
    >
      {dark && (
        <>
          <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "32px" })} />
          <span aria-hidden="true" className="orb orb-blue -top-48 -left-40 size-[480px]" />
          <span aria-hidden="true" className="orb orb-cyan -right-48 -bottom-56 size-[420px]" style={vars({ i: 1 })} />
        </>
      )}
      <span className="inline-flex items-center gap-3">
        <IconTile name={icon} tone={dark ? "glass" : "gradient"} className="size-12 rounded-[14px]" iconSize={24} />
        <span dir="ltr" className={cx("text-sm leading-[1.7] font-semibold tracking-wide", dark ? "text-sky-300" : "text-brand-hover")}>
          {eyebrow}
        </span>
      </span>
      <h2 className="t-h2 mt-5 lg:mt-6">{title}</h2>
      <p className="body-lg mt-3 lg:mt-4">{text}</p>
      <ul className="mt-6 flex w-full flex-col gap-2.5 lg:mt-8">
        {items.map((item, i) => (
          <li
            key={i}
            className={cx(
              "flex items-start gap-3 rounded-lg border px-4 py-3 text-base leading-[1.9] lg:items-center lg:gap-4",
              dark ? "border-white/10 bg-white/[0.04] text-white" : "border-line bg-page text-ink",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "mt-[3px] flex size-6 shrink-0 items-center justify-center rounded-full lg:mt-0",
                dark ? "bg-cyan-400/15 text-cyan-300" : "bg-soft text-brand",
              )}
            >
              <Icon name="check" size={15} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {link && (
        <ButtonLink href={link.href} variant={dark ? "white" : "secondary"} arrow className="mt-8 w-full sm:w-auto lg:mt-10">
          {link.label}
        </ButtonLink>
      )}
    </div>
  );
}
