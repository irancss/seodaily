import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";

import { Badge, Card, formatDate, PageHeader } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/icon";
import { db, schema } from "@/db";
import { SERVICE_CHOICE_LABELS } from "@/lib/content";

import { STATUS_LABELS, STATUS_TONES } from "./leads/status";

export const metadata = { title: "داشبورد" };

async function total(table: typeof schema.services | typeof schema.projects | typeof schema.leads) {
  const [{ value }] = await db.select({ value: count() }).from(table);
  return value;
}

export default async function Dashboard() {
  const [services, projects, leads, [{ value: newLeads }], latest] = await Promise.all([
    total(schema.services),
    total(schema.projects),
    total(schema.leads),
    db.select({ value: count() }).from(schema.leads).where(eq(schema.leads.status, "new")),
    db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(6),
  ]);

  const stats: { label: string; value: number; href: string; icon: IconName }[] = [
    { label: "درخواست جدید", value: newLeads, href: "/admin/leads?status=new", icon: "inbox" },
    { label: "همه درخواست‌ها", value: leads, href: "/admin/leads", icon: "list-doc" },
    { label: "زیرخدمات", value: services, href: "/admin/services", icon: "layers" },
    { label: "نمونه‌کارها", value: projects, href: "/admin/projects", icon: "image" },
  ];

  return (
    <>
      <PageHeader title="داشبورد" description="خلاصه وضعیت سایت و آخرین درخواست‌های مشاوره." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="flex items-center gap-4 rounded-xl border border-line bg-white p-5 text-ink no-underline hover:border-brand hover:text-ink">
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

      <Card title="آخرین درخواست‌ها" className="mt-8">
        {latest.length === 0 ? (
          <p className="text-sm text-muted">هنوز درخواستی ثبت نشده است.</p>
        ) : (
          <ul className="divide-y divide-line">
            {latest.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-ink no-underline hover:text-brand">
                  <span className="flex flex-col">
                    <span className="font-semibold">{l.name}</span>
                    <span className="text-xs text-muted">
                      {SERVICE_CHOICE_LABELS[l.service]} · {formatDate(l.createdAt)}
                    </span>
                  </span>
                  <Badge tone={STATUS_TONES[l.status]}>{STATUS_LABELS[l.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/projects/new" className="btn btn-secondary h-12">افزودن نمونه‌کار</Link>
        <Link href="/admin/services/new" className="btn btn-secondary h-12">افزودن زیرخدمت</Link>
        <Link href="/admin/pages" className="btn btn-secondary h-12">ویرایش تایتل و متای صفحات</Link>
      </div>
    </>
  );
}
