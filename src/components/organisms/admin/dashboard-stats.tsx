import Link from "next/link";

import { Icon, type IconName } from "@/components/atoms";

export type DashboardCounts = { services: number; projects: number; leads: number; newLeads: number };

export function DashboardStats({ services, projects, leads, newLeads }: DashboardCounts) {
  const stats: { label: string; value: number; href: string; icon: IconName }[] = [
    { label: "درخواست جدید", value: newLeads, href: "/admin/leads?status=new", icon: "inbox" },
    { label: "همه درخواست‌ها", value: leads, href: "/admin/leads", icon: "list-doc" },
    { label: "زیرخدمات", value: services, href: "/admin/services", icon: "layers" },
    { label: "نمونه‌کارها", value: projects, href: "/admin/projects", icon: "image" },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <li key={s.label}>
          <Link href={s.href} className="flex flex-col items-start gap-3 rounded-xl border border-line bg-white p-4 text-ink no-underline hover:border-brand hover:text-ink sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <span className="flex size-12 items-center justify-center rounded-md bg-soft text-brand">
              <Icon name={s.icon} size={22} />
            </span>
            <span>
              <span className="block text-2xl leading-[1.4] font-bold">{s.value}</span>
              <span className="text-sm text-muted">{s.label}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
