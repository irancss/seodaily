import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";

import { Badge, EmptyState } from "@/components/atoms";
import { Flash, PageHeader } from "@/components/molecules";
import { formatDate, cx } from "@/lib/utils";
import { db, schema } from "@/db";
import { LEAD_STATUSES, type LeadStatus } from "@/db/schema";
import { SERVICE_CHOICE_LABELS } from "@/modules/leads/constants";

import { STATUS_LABELS, STATUS_TONES } from "@/modules/leads/status";

export const metadata = { title: "درخواست‌های مشاوره" };

const PAGE_SIZE = 30;

type Props = { searchParams: Promise<{ status?: string; page?: string; ok?: string; error?: string }> };

export default async function LeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = LEAD_STATUSES.includes(sp.status as LeadStatus) ? (sp.status as LeadStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = status ? eq(schema.leads.status, status) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(schema.leads)
      .where(where)
      .orderBy(desc(schema.leads.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(schema.leads).where(where),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (s?: string, p?: number) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (p && p > 1) q.set("page", String(p));
    const qs = q.toString();
    return `/admin/leads${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader title="درخواست‌های مشاوره" description="فرم‌هایی که از صفحه تماس ارسال شده‌اند." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="mb-6 flex flex-wrap gap-2">
        {[undefined, ...LEAD_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={href(s)}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm font-medium no-underline",
              status === s ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink-2",
            )}
          >
            {s ? STATUS_LABELS[s] : "همه"}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState>درخواستی برای نمایش وجود ندارد.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="bg-page text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">نام</th>
                <th className="px-4 py-3 font-medium">شماره تماس</th>
                <th className="px-4 py-3 font-medium">خدمت</th>
                <th className="px-4 py-3 font-medium">تاریخ</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((l) => (
                <tr key={l.id} className={l.status === "new" ? "font-semibold" : undefined}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${l.id}`} className="text-ink hover:text-brand">
                      {l.name}
                    </Link>
                    {l.business && <span className="block text-xs font-normal text-muted">{l.business}</span>}
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    <a href={`tel:${l.phone}`} className="text-ink-2">
                      {l.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{SERVICE_CHOICE_LABELS[l.service]}</td>
                  <td className="px-4 py-3 text-ink-2">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONES[l.status]}>{STATUS_LABELS[l.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="صفحه‌بندی" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={href(status, p)}
              aria-current={p === page ? "page" : undefined}
              className={cx("flex size-10 items-center justify-center rounded-sm border text-sm no-underline", p === page ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink")}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
