"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Icon } from "@/components/atoms";

import { cx } from "@/lib/utils";

export const NAV = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/web-design", label: "طراحی سایت" },
  { href: "/seo", label: "سئو" },
  { href: "/portfolio", label: "نمونه‌کارها" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ siteName }: { siteName: string }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  // Close the mobile menu after navigating.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-line bg-white lg:h-[72px]">
      <div className="container-site flex h-full items-center justify-between gap-8">
        <Link href="/" className="text-xl leading-[1.65] font-bold text-ink no-underline hover:text-ink lg:text-2xl">
          {siteName}
        </Link>

        <nav aria-label="منوی اصلی" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "block py-6 text-base leading-normal no-underline hover:text-brand",
                      active
                        ? "border-b-2 border-brand pb-[22px] font-semibold text-brand"
                        : "font-medium text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link href="/contact" className="btn btn-primary hidden h-12 px-6 lg:inline-flex">
          درخواست مشاوره
        </Link>

        <details ref={menu} className="group lg:hidden">
          <summary
            aria-label="منو"
            className="flex size-11 items-center justify-center rounded-sm border border-line text-ink"
          >
            <span className="group-open:hidden">
              <Icon name="menu" size={22} />
            </span>
            <span className="hidden group-open:inline">
              <Icon name="close" size={22} />
            </span>
          </summary>
          <div className="absolute inset-x-0 top-16 border-b border-line bg-white px-5 pt-2 pb-6 shadow-lg">
            <nav aria-label="منوی اصلی">
              <ul>
                {NAV.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cx(
                          "flex h-14 items-center justify-between border-b border-line text-lg leading-[1.9] no-underline",
                          active ? "font-semibold text-brand" : "font-medium text-ink",
                        )}
                      >
                        {item.label}
                        {active && <span aria-hidden="true" className="size-2 rounded-full bg-brand" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <Link href="/contact" className="btn btn-primary mt-6 flex h-[52px] w-full">
              درخواست مشاوره
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
