import type { ReactNode } from "react";

import { Highlight } from "@/components/atoms";
import { Breadcrumb } from "@/components/molecules";
import { cx, vars } from "@/lib/utils";

/**
 * Top section of the inner pages: breadcrumb, badge, title (a word in *stars*
 * gets the brand gradient), subtitle, actions and an optional visual beside
 * the text. `dark` sits on the navy surface with drifting glows.
 */
export function PageHero({
  tone = "dark",
  breadcrumb,
  badge,
  title,
  subtitle,
  actions,
  aside,
  children,
  className,
}: {
  tone?: "dark" | "light";
  breadcrumb?: { label: string; href?: string }[];
  badge?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Visual shown beside the text on desktop (below it on mobile). */
  aside?: ReactNode;
  /** Extra content under the actions (chips, anchors…). */
  children?: ReactNode;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <section className={cx("relative overflow-hidden pt-8 pb-14 lg:pt-12 lg:pb-24", dark ? "surface-dark" : "isolate bg-page", className)}>
      <div
        aria-hidden="true"
        className={cx("fade-down pointer-events-none absolute inset-0 -z-10", dark ? "grid-bg-dark" : "grid-bg opacity-60")}
        style={vars({ grid: "56px" })}
      />
      <span aria-hidden="true" className={cx("orb -top-56 -right-40 size-[560px]", dark ? "orb-blue" : "orb-soft-blue")} />
      <span
        aria-hidden="true"
        className={cx("orb top-24 -left-48 size-[520px]", dark ? "orb-cyan" : "orb-soft-cyan")}
        style={vars({ i: 1 })}
      />
      <div className="container-site relative">
        {breadcrumb && (
          <div className="animate-in">
            <Breadcrumb items={breadcrumb} inverse={dark} />
          </div>
        )}
        <div
          className={cx(
            "grid items-center gap-10 lg:gap-16",
            breadcrumb ? "mt-6 lg:mt-12" : "mt-2 lg:mt-8",
            aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : undefined,
          )}
        >
          <div className="flex flex-col items-start">
            {badge && (
              <span
                className={cx(
                  "animate-in",
                  dark
                    ? "badge-glass"
                    : "inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1 text-sm leading-[1.7] font-medium text-brand-hover",
                )}
              >
                <span aria-hidden="true" className={dark ? "live-dot" : "size-2 rounded-full bg-brand"} />
                {badge}
              </span>
            )}
            <h1 className={cx("t-h1 animate-in max-w-[860px]", badge && "mt-4 lg:mt-6")} style={vars({ i: 1 })}>
              {typeof title === "string" ? <Highlight text={title} /> : title}
            </h1>
            {subtitle && (
              <p className="body-lg animate-in mt-4 max-w-[680px] lg:mt-6" style={vars({ i: 2 })}>
                {subtitle}
              </p>
            )}
            {actions && (
              <div
                className="animate-in mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:mt-10"
                style={vars({ i: 3 })}
              >
                {actions}
              </div>
            )}
            {children && (
              <div className="animate-in mt-8 w-full" style={vars({ i: 4 })}>
                {children}
              </div>
            )}
          </div>
          {aside && (
            <div className="animate-scale min-w-0" style={vars({ i: 2 })}>
              {aside}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
