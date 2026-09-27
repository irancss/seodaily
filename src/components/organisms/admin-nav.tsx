"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/atoms";
import { cx } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "داشبورد", icon: "home" },
  { href: "/admin/leads", label: "درخواست‌های مشاوره", icon: "inbox" },
  { href: "/admin/services", label: "خدمات و زیرخدمات", icon: "layers" },
  { href: "/admin/projects", label: "نمونه‌کارها", icon: "image" },
  { href: "/admin/faqs", label: "سؤال‌های متداول", icon: "question" },
  { href: "/admin/team", label: "تیم", icon: "team" },
  { href: "/admin/pricing", label: "تعرفه و ماشین‌حساب", icon: "bar-chart" },
  { href: "/admin/contracts", label: "قالب قرارداد", icon: "doc-check" },
  { href: "/admin/menus", label: "منوی سایت", icon: "menu" },
  { href: "/admin/pages", label: "متن و سئوی صفحات", icon: "file" },
  { href: "/admin/settings", label: "تنظیمات سایت", icon: "settings" },
  { href: "/admin/account", label: "حساب کاربری", icon: "lock" },
];

export function AdminNav({ newLeads }: { newLeads: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="منوی پنل">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium whitespace-nowrap no-underline",
                  active ? "bg-soft text-brand" : "text-ink-2 hover:bg-page hover:text-ink",
                )}
              >
                <Icon name={item.icon} size={18} />
                <span className="grow">{item.label}</span>
                {item.href === "/admin/leads" && newLeads > 0 && (
                  <span className="rounded-full bg-brand px-2 text-xs leading-[1.7] font-bold text-white">{newLeads}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
