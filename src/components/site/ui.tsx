import Link from "next/link";
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/icon";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Small rounded label with a blue dot, above every hero title. */
export function HeroBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1 text-sm leading-[1.7] font-medium text-brand-hover">
      <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
      {children}
    </span>
  );
}

/** Faint grid that sits behind heroes and CTAs. */
export function GridBackdrop({
  className,
  size = 48,
  fade = "down",
}: {
  className?: string;
  size?: number;
  fade?: "down" | "radial" | "none";
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "grid-bg pointer-events-none absolute inset-0",
        fade === "down" && "fade-down",
        fade === "radial" && "fade-radial",
        className,
      )}
      style={{ ["--grid" as string]: `${size}px` }}
    />
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  className?: string;
}) {
  const sizes = { sm: "h-12 px-5", md: "h-[52px] px-7", lg: "h-14 px-8" };
  return (
    <Link
      href={href}
      className={cx(
        "btn",
        variant === "primary" ? "btn-primary" : "btn-secondary",
        sizes[size],
        size === "lg" && variant === "primary" && "shadow-brand",
        className,
      )}
    >
      {children}
      {arrow && <Icon name="arrow-left" />}
    </Link>
  );
}

export function SectionHeading({
  title,
  text,
  align = "split",
  action,
  className,
}: {
  title: ReactNode;
  text?: ReactNode;
  align?: "split" | "stack" | "center";
  action?: ReactNode;
  className?: string;
}) {
  if (align === "center") {
    return (
      <div className={cx("flex flex-col gap-3 lg:items-center lg:text-center", className)}>
        <h2 className="t-h2">{title}</h2>
        {text && <p className="body-lg max-w-[680px]">{text}</p>}
      </div>
    );
  }
  if (align === "stack") {
    return (
      <div className={cx("flex max-w-[720px] flex-col gap-3", className)}>
        <h2 className="t-h2">{title}</h2>
        {text && <p className="body-lg">{text}</p>}
        {action}
      </div>
    );
  }
  if (action) {
    // Title and text stay together with the action at the far end. On mobile
    // the design moves the action below the content, so pages render it there.
    return (
      <div className={cx("flex items-end justify-between gap-12", className)}>
        <div className="flex flex-col gap-2 lg:max-w-[640px] lg:gap-3">
          <h2 className="t-h2">{title}</h2>
          {text && <p className="body-lg">{text}</p>}
        </div>
        <div className="hidden shrink-0 lg:block">{action}</div>
      </div>
    );
  }
  return (
    <div
      className={cx(
        "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16",
        className,
      )}
    >
      <h2 className="t-h2 lg:max-w-[640px]">{title}</h2>
      {text && <p className="body-lg lg:max-w-[520px]">{text}</p>}
    </div>
  );
}

export function Dots({ size = 10 }: { size?: number }) {
  return (
    <div aria-hidden="true" className="flex gap-1.5">
      <span className="rounded-full bg-line-strong" style={{ width: size, height: size }} />
      <span className="rounded-full bg-line" style={{ width: size, height: size }} />
      <span className="rounded-full bg-line" style={{ width: size, height: size }} />
    </div>
  );
}

/** Browser chrome around an image or a placeholder. */
export function BrowserFrame({
  children,
  url = "www.example.com",
  compact = false,
  shadow = "md",
  className,
}: {
  children: ReactNode;
  url?: string | null;
  compact?: boolean;
  shadow?: "none" | "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col overflow-hidden rounded-md border border-line bg-white",
        shadow === "md" && "shadow-md",
        shadow === "sm" && "shadow-sm",
        className,
      )}
    >
      <div
        className={cx(
          "flex shrink-0 items-center gap-4 border-b border-line bg-page",
          compact ? "h-7 px-2.5 lg:h-9 lg:px-3.5" : "h-9 px-3 lg:h-11 lg:px-4",
        )}
      >
        <Dots size={compact ? 8 : 10} />
        {url !== null && !compact && (
          <div
            dir="ltr"
            className="flex h-[22px] min-w-0 grow items-center truncate rounded-full border border-line bg-white px-2.5 text-sm text-muted lg:h-7 lg:px-3"
          >
            {url}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export function PlaceholderChip({ children, icon = false }: { children: ReactNode; icon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm leading-[1.7] font-medium whitespace-nowrap text-ink-2 shadow-sm">
      {icon && <Icon name="image" size={18} />}
      {children}
    </span>
  );
}

/** Image area of a project/service: the uploaded picture or the design's grid placeholder. */
export function Visual({
  src,
  alt,
  label = "نمونه پروژه",
  tone = "soft",
  className,
}: {
  src?: string | null;
  alt: string;
  label?: string;
  tone?: "soft" | "page";
  className?: string;
}) {
  if (src) {
    return (
      <div className={cx("relative overflow-hidden bg-page", className)}>
        <img src={src} alt={alt} className="absolute inset-0 size-full object-cover object-top" />
      </div>
    );
  }
  return (
    <div
      className={cx(
        "grid-bg flex items-center justify-center",
        tone === "soft" ? "bg-soft" : "bg-page",
        className,
      )}
      style={{ ["--grid" as string]: "32px" }}
    >
      <PlaceholderChip>{label}</PlaceholderChip>
    </div>
  );
}

export function ArrowBadge({
  size = 44,
  variant = "outline",
  icon = "arrow-left",
}: {
  size?: number;
  variant?: "outline" | "soft" | "white";
  icon?: IconName;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "arrow-badge",
        variant === "outline" && "border border-line",
        variant === "soft" && "bg-soft",
        variant === "white" && "bg-white",
      )}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={size <= 36 ? 18 : 20} />
    </span>
  );
}

export function IconTile({
  name,
  size = 56,
  iconSize = 28,
  round = false,
  tone = "soft",
  className,
}: {
  name: IconName | string;
  size?: number;
  iconSize?: number;
  round?: boolean;
  tone?: "soft" | "white";
  /** Size classes (e.g. responsive); replaces `size` when given. */
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex shrink-0 items-center justify-center text-brand",
        round ? "rounded-full" : "rounded-md",
        tone === "soft" ? "bg-soft" : "border border-line bg-white",
        className,
      )}
      style={className ? undefined : { width: size, height: size }}
    >
      <Icon name={name} size={iconSize} strokeWidth={1.75} />
    </span>
  );
}

export function Breadcrumb({
  items,
  separator = "chevron",
}: {
  items: { label: string; href?: string }[];
  /** `slash`: the services page variant with underlined links. */
  separator?: "chevron" | "slash";
}) {
  const slash = separator === "slash";
  return (
    <nav aria-label="مسیر صفحه">
      <ol
        className={cx(
          "flex flex-wrap items-center gap-2 text-sm",
          slash ? "leading-[1.8] text-muted" : "leading-[1.7] font-medium",
        )}
      >
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="flex text-muted">
                {slash ? "/" : <Icon name="chevron-left" size={16} />}
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={cx(
                  "text-ink-2 hover:text-brand",
                  slash ? "underline underline-offset-4" : "no-underline",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Two-digit Persian-friendly step number (the font renders Farsi digits). */
export function stepNo(index: number) {
  return String(index + 1).padStart(2, "0");
}
