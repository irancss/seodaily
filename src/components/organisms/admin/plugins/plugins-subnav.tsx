"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/plugins", label: "افزونه‌ها", exact: true },
  { href: "/admin/plugins/categories", label: "دسته‌ها" },
  { href: "/admin/plugins/blocks", label: "بلوک‌های سراسری" },
  { href: "/admin/plugins/monitor", label: "پایش به‌روزرسانی" },
  { href: "/admin/plugins/users", label: "دانلودکنندگان و آمار" },
];

export function PluginsSubnav() {
  const path = usePathname();
  return (
    <nav aria-label="بخش‌های کتابخانه افزونه" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {LINKS.map((l) => {
        const active = l.exact ? path === l.href : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium no-underline ${active ? "border-brand text-brand" : "border-transparent text-ink-2 hover:text-ink"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
