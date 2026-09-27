import type { ReactNode } from "react";

import { ButtonLink, Highlight, PhoneLink } from "@/components/atoms";
import { cx, vars } from "@/lib/utils";
import { getContact } from "@/modules/settings/queries";

/**
 * Closing call-to-action: a dark panel with drifting glows, the main button
 * and the site's phone number. `light` is the soft-blue variant for pages that
 * already end on a dark section.
 */
export async function CtaSection({
  title,
  text,
  eyebrow,
  button = "درخواست مشاوره",
  href = "/contact",
  secondary,
  tone = "dark",
  padTop = false,
}: {
  title: string;
  text: string;
  eyebrow?: string;
  button?: string;
  href?: string;
  secondary?: ReactNode;
  tone?: "dark" | "light";
  /** Panels that follow a white section need their own top spacing. */
  padTop?: boolean;
}) {
  const { phone } = await getContact();
  const dark = tone === "dark";

  return (
    <section className={cx("flex grow items-center pb-16 lg:pb-24", padTop && "pt-16 lg:pt-24")}>
      <div className="container-site">
        <div
          className={cx(
            "reveal-scale relative overflow-hidden rounded-xl px-6 py-10 lg:rounded-2xl lg:px-16 lg:py-16",
            dark ? "surface-dark" : "surface-soft-gradient isolate border border-line",
          )}
        >
          <div
            aria-hidden="true"
            className={cx("fade-radial pointer-events-none absolute inset-0 -z-10", dark ? "grid-bg-dark" : "grid-bg opacity-70")}
            style={vars({ grid: "40px" })}
          />
          <span aria-hidden="true" className={cx("orb -top-44 -right-28 size-[440px]", dark ? "orb-blue" : "orb-soft-blue")} />
          <span
            aria-hidden="true"
            className={cx("orb -bottom-52 -left-28 size-[480px]", dark ? "orb-cyan" : "orb-soft-cyan")}
            style={vars({ i: 1 })}
          />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
            <div className="flex flex-col items-start gap-3 lg:gap-4">
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              <h2 className="t-h2 max-w-[720px]">
                <Highlight text={title} />
              </h2>
              <p className="body-lg max-w-[620px]">{text}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-col lg:flex-nowrap">
              <ButtonLink href={href} size="lg" variant={dark ? "white" : "primary"} arrow className="w-full sm:w-auto lg:w-full">
                {button}
              </ButtonLink>
              {phone && (
                <PhoneLink
                  phone={phone}
                  className={cx("btn h-14 w-full px-8 sm:w-auto lg:w-full", dark ? "btn-glass" : "btn-secondary")}
                />
              )}
              {secondary}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
