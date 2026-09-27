import Link from "next/link";

import { BrandMark } from "@/components/atoms/brand-mark";
import { Icon } from "@/components/atoms/icon";
import { PhoneLink } from "@/components/atoms/phone-link";
import { cx, phoneE164 } from "@/lib/utils";
import type { Menus } from "@/modules/menus/types";

import { DesktopNav } from "./desktop-nav";
import { MobileDrawer } from "./mobile-drawer";

/**
 * Sticky glass header. The desktop menu needs more room when it has many
 * top-level items, so it then switches on at the xl breakpoint instead of lg.
 */
export function SiteHeader({ siteName, menus, phone }: { siteName: string; menus: Menus; phone: string }) {
  const wide = menus.desktop.length > 6;
  return (
    <header className="header-lift sticky top-0 z-30 shrink-0 border-b border-line/70 backdrop-blur-xl">
      <div className="container-site flex h-16 items-center gap-4 lg:h-[76px]">
        <BrandMark name={siteName} />

        <DesktopNav items={menus.desktop} className={cx("mx-auto", wide ? "hidden xl:block" : "hidden lg:block")} />

        <div className="ms-auto flex items-center gap-2">
          {phone && (
            // Wrapped: PhoneLink sets its own display, which would beat `hidden`.
            <span className="hidden xl:flex">
              <PhoneLink
                phone={phone}
                className="h-11 rounded-full px-3 text-[15px] font-semibold text-ink hover:bg-soft hover:text-brand"
                iconClassName="size-8 rounded-full bg-soft text-brand"
              />
            </span>
          )}
          <Link href="/contact" className={cx("btn btn-primary h-11 px-5 text-[15px]", wide ? "hidden xl:inline-flex" : "hidden lg:inline-flex")}>
            درخواست مشاوره
          </Link>
          {phone && (
            <a
              href={`tel:${phoneE164(phone)}`}
              aria-label="تماس تلفنی"
              className={cx(
                "flex size-11 items-center justify-center rounded-full bg-soft text-brand",
                wide ? "xl:hidden" : "lg:hidden",
              )}
            >
              <Icon name="phone" size={20} />
            </a>
          )}
          <MobileDrawer items={menus.mobile} siteName={siteName} phone={phone} className={wide ? "xl:hidden" : "lg:hidden"} />
        </div>
      </div>
      <span aria-hidden="true" className="scroll-progress" />
    </header>
  );
}
