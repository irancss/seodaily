import Link from "next/link";

import { Badge } from "@/components/atoms";
import { Card } from "@/components/molecules";
import type { Lead } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { SERVICE_CHOICE_LABELS } from "@/modules/leads/constants";
import { STATUS_LABELS, STATUS_TONES } from "@/modules/leads/status";

export function LatestLeads({ leads }: { leads: Lead[] }) {
  return (
    <Card title="آخرین درخواست‌ها" className="mt-8">
      {leads.length === 0 ? (
        <p className="text-sm text-muted">هنوز درخواستی ثبت نشده است.</p>
      ) : (
        <ul className="divide-y divide-line">
          {leads.map((l) => (
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
  );
}
