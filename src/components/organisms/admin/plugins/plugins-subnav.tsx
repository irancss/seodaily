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
    <nav aria-label="بخش‌های کتابخانه افزونه" className="mb-6 flex flex-wrap gap-2">
      {LINKS.map((l) => {
        const active = l.exact ? !LINKS.some((other) => !other.exact && (path === other.href || path.startsWith(`${other.href}/`))) : path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium no-underline ${active ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink-2"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
