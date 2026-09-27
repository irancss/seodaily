"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { BrandMark } from "@/components/atoms/brand-mark";
import { Icon } from "@/components/atoms/icon";
import { PhoneLink } from "@/components/atoms/phone-link";
import { isMenuItemActive, isMenuUrlActive } from "@/modules/menus/normalize";
import type { MenuItem } from "@/modules/menus/types";

function TreeNode({ item, pathname }: { item: MenuItem; pathname: string }) {
  const hasChildren = item.children.length > 0;
  // The branch holding the current page starts expanded.
  const [open, setOpen] = useState(() => hasChildren && isMenuItemActive(item, pathname));
  const panelId = useId();
  const current = isMenuUrlActive(item.url, pathname);

  const content = (
    <>
      {current && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand" />}
      <span>{item.label}</span>
      {item.newTab && <Icon name="external" size={14} className="opacity-60" />}
    </>
  );

  return (
    <li>
      <div className="mnav-row">
        {item.url ? (
          <Link
            href={item.url}
            className="mnav-link"
            aria-current={current ? "page" : undefined}
            {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {content}
          </Link>
        ) : (
          <button type="button" className="mnav-link" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
            {content}
          </button>
        )}
        {hasChildren && (
          <button
            type="button"
            className="mnav-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? "بستن" : "باز کردن"} زیرمنوی ${item.label}`}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name="chevron-down" size={18} />
          </button>
        )}
      </div>
      {hasChildren && (
        <div id={panelId} className="mnav-children" data-open={open || undefined} inert={!open}>
          <ul>
            {item.children.map((child) => (
              <TreeNode key={child.id} item={child} pathname={pathname} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

/** Off-canvas menu for small screens; slides in from the right edge. */
export function MobileDrawer({
  items,
  siteName,
  phone,
  className,
}: {
  items: MenuItem[];
  siteName: string;
  phone: string;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Navigating closes the drawer.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="باز کردن منو"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className={`flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-brand hover:text-brand ${className ?? ""}`}
      >
        <Icon name="menu" size={22} />
      </button>

      <dialog
        ref={dialog}
        className="drawer"
        aria-label="منوی سایت"
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
            <BrandMark name={siteName} />
            <button
              type="button"
              aria-label="بستن منو"
              onClick={() => dialog.current?.close()}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-page text-ink hover:bg-soft hover:text-brand"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <nav aria-label="منوی اصلی" className="grow overflow-y-auto overscroll-contain px-5 py-2">
            <ul>
              {items.map((item) => (
                <TreeNode key={item.id} item={item} pathname={pathname} />
              ))}
            </ul>
          </nav>

          <div className="shrink-0 space-y-3 border-t border-line bg-page p-5">
            {phone && (
              <PhoneLink
                phone={phone}
                className="flex h-12 w-full items-center justify-center rounded-md border border-line bg-white text-base font-semibold text-ink hover:border-brand hover:text-brand"
                iconClassName="text-brand"
              />
            )}
            <Link href="/contact" className="btn btn-primary h-12 w-full">
              درخواست مشاوره
              <Icon name="arrow-left" />
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
