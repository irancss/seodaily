"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Icon } from "@/components/atoms/icon";
import { isMenuItemActive, isMenuUrlActive } from "@/modules/menus/normalize";
import type { MenuItem } from "@/modules/menus/types";
import { cx } from "@/lib/utils";

function NavNode({ item, depth, pathname, flip = false }: { item: MenuItem; depth: number; pathname: string; flip?: boolean }) {
  const [open, setOpen] = useState(false);
  const node = useRef<HTMLLIElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const hasChildren = item.children.length > 0;
  const current = isMenuUrlActive(item.url, pathname);
  const withinActive = isMenuItemActive(item, pathname);

  // Close when clicking elsewhere.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!node.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key === "Escape" && (open || node.current?.contains(document.activeElement))) {
      event.stopPropagation();
      setOpen(false);
      (toggle.current ?? node.current?.querySelector<HTMLElement>("a,button"))?.focus();
      // Drop :focus-within so the CSS-open submenu closes too.
      if (!toggle.current) (document.activeElement as HTMLElement | null)?.blur();
    }
  }

  const label = (
    <>
      <span>{item.label}</span>
      {item.newTab && <Icon name="external" size={13} className="opacity-60" />}
    </>
  );

  return (
    <li
      ref={node}
      className={cx("nav-node relative", flip && "nav-flip")}
      data-open={open || undefined}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={hasChildren ? onKeyDown : undefined}
    >
      <div className="flex items-center">
        {item.url ? (
          <Link
            href={item.url}
            className="nav-link"
            aria-current={current ? "page" : undefined}
            data-active={!current && withinActive ? "" : undefined}
            {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {label}
            {hasChildren && depth > 0 && <Icon name="chevron-left" size={16} className="opacity-50" />}
          </Link>
        ) : (
          <button
            type="button"
            className="nav-link cursor-pointer"
            aria-expanded={open}
            data-active={withinActive ? "" : undefined}
            onClick={() => setOpen((v) => !v)}
          >
            {label}
            {hasChildren && <Icon name={depth > 0 ? "chevron-left" : "chevron-down"} size={16} className="opacity-60" />}
          </button>
        )}
        {hasChildren && item.url && depth === 0 && (
          <button
            ref={toggle}
            type="button"
            className="nav-chevron"
            aria-expanded={open}
            aria-label={`زیرمنوی ${item.label}`}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name="chevron-down" size={16} />
          </button>
        )}
      </div>
      {hasChildren && (
        <ul className="nav-submenu" aria-label={item.label}>
          {item.children.map((child) => (
            <NavNode key={child.id} item={child} depth={depth + 1} pathname={pathname} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Header navigation for large screens; submenus open on hover, focus or click. */
export function DesktopNav({ items, className }: { items: MenuItem[]; className?: string }) {
  const pathname = usePathname();
  const list = useRef<HTMLUListElement>(null);

  // After navigating, drop focus from the menu so no submenu stays open.
  useEffect(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && list.current?.contains(active)) active.blur();
  }, [pathname]);

  // Items in the left half open their submenus towards the right edge instead.
  const half = Math.ceil(items.length / 2);
  return (
    <nav aria-label="منوی اصلی" className={className}>
      <ul ref={list} className="flex items-center gap-0.5">
        {items.map((item, index) => (
          <NavNode key={item.id} item={item} depth={0} pathname={pathname} flip={index >= half} />
        ))}
      </ul>
    </nav>
  );
}
