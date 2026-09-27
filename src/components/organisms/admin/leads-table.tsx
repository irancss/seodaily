import Link from "next/link";

import { Badge, EmptyState } from "@/components/atoms";
import type { Lead } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { SERVICE_CHOICE_LABELS } from "@/modules/leads/constants";
import { STATUS_LABELS, STATUS_TONES } from "@/modules/leads/status";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) return <EmptyState>درخواستی برای نمایش وجود ندارد.</EmptyState>;
  return (
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
          {leads.map((l) => (
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
  );
}
