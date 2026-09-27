import type { ReactNode } from "react";

import { ButtonLink, cx, GridBackdrop } from "./ui";

/**
 * Closing call-to-action. `soft` is the blue panel (web design, about),
 * `white` the bordered panel (service template), `open` has no panel (SEO,
 * portfolio).
 */
export function CtaSection({
  title,
  text,
  button = "درخواست مشاوره",
  href = "/contact",
  variant = "soft",
  secondary,
  padTop = false,
  grid = true,
}: {
  title: string;
  text: string;
  button?: string;
  href?: string;
  variant?: "soft" | "white" | "open";
  secondary?: ReactNode;
  /** Panels that follow a white section need their own top spacing. */
  padTop?: boolean;
  /** Faint grid behind the panel (the about page panel has none). */
  grid?: boolean;
}) {
  if (variant === "open") {
    return (
      <section className="relative flex grow items-center overflow-hidden py-16 lg:py-24">
        <GridBackdrop fade="radial" className="opacity-60" />
        <div className="container-site relative flex flex-col items-center text-center">
          <h2 className="t-h2 max-w-[760px]">{title}</h2>
          <p className="body-lg mt-3 max-w-[680px] lg:mt-4">{text}</p>
          <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap lg:mt-8 lg:gap-4">
            <ButtonLink href={href} size="lg" arrow className="w-full sm:w-auto">
              {button}
            </ButtonLink>
            {secondary}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("flex grow items-center pb-16 lg:pb-24", padTop && "pt-16 lg:pt-24")}>
      <div className="container-site">
        <div
          className={cx(
            "relative flex flex-col items-start overflow-hidden rounded-xl border border-line px-6 py-7 lg:items-center lg:rounded-2xl lg:p-16 lg:text-center",
            variant === "soft" ? "bg-soft" : "bg-white",
          )}
        >
          {grid && <GridBackdrop size={32} className={variant === "white" ? "opacity-60" : undefined} />}
          <h2 className="t-h2 relative max-w-[760px]">{title}</h2>
          <p className="body-lg relative mt-3 max-w-[640px] lg:mt-4">{text}</p>
          <div className="relative mt-6 flex w-full flex-col gap-3 lg:mt-8 lg:w-auto lg:flex-row lg:items-center lg:justify-center lg:gap-4">
            <ButtonLink href={href} size="lg" arrow className="w-full lg:w-auto">
              {button}
            </ButtonLink>
            {secondary}
          </div>
        </div>
      </div>
    </section>
  );
}
