import type { ReactNode } from "react";

import { Card } from "@/components/molecules";
import type { Lead } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { SERVICE_CHOICE_LABELS } from "@/modules/leads/constants";

export function LeadDetails({ lead }: { lead: Lead }) {
  const rows: [string, ReactNode][] = [
    ["نام", lead.name],
    ["شماره تماس", <a key="p" href={`tel:${lead.phone}`} dir="ltr">{lead.phone}</a>],
    ["کسب‌وکار", lead.business || "—"],
    [
      "وب‌سایت",
      lead.website ? (
        <a key="w" href={/^https?:\/\//.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer nofollow" dir="ltr">
          {lead.website}
        </a>
      ) : (
        "—"
      ),
    ],
    ["نوع خدمت", SERVICE_CHOICE_LABELS[lead.service]],
    ["بودجه", lead.budget || "—"],
    ["تاریخ ثبت", formatDate(lead.createdAt)],
  ];

  return (
    <Card title="اطلاعات درخواست">
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 py-3 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-6 text-sm font-medium text-muted">توضیح پروژه</h3>
      <p className="mt-2 rounded-sm bg-page p-4 text-sm leading-[1.9] whitespace-pre-line">{lead.description || "—"}</p>
    </Card>
  );
}
