import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ConfirmButton, SubmitButton } from "@/components/atoms";
import { Card, Flash, PageHeader, Select } from "@/components/molecules";
import { formatDate } from "@/lib/utils";
import { db, schema } from "@/db";
import { LEAD_STATUSES } from "@/db/schema";
import { SERVICE_CHOICE_LABELS } from "@/modules/leads/constants";

import { deleteLead, updateLead } from "@/modules/leads/actions";
import { STATUS_LABELS } from "@/modules/leads/status";

export const metadata = { title: "جزئیات درخواست" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function LeadPage({ params, searchParams }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const lead = await db.query.leads.findFirst({ where: eq(schema.leads.id, id) });
  if (!lead) notFound();
  const sp = await searchParams;

  const rows: [string, React.ReactNode][] = [
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
    <>
      <PageHeader title={lead.name} back={{ href: "/admin/leads", label: "همه درخواست‌ها" }} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
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

        <div className="flex flex-col gap-6">
          <Card title="پیگیری">
            <form action={updateLead} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={lead.id} />
              <Select label="وضعیت" name="status" defaultValue={lead.status} options={LEAD_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))} />
              <div className="flex flex-col gap-2">
                <label htmlFor="adminNote" className="field-label">یادداشت داخلی</label>
                <textarea id="adminNote" name="adminNote" rows={5} defaultValue={lead.adminNote} className="field" />
              </div>
              <SubmitButton />
            </form>
          </Card>
          <form action={deleteLead}>
            <input type="hidden" name="id" value={lead.id} />
            <ConfirmButton message="این درخواست برای همیشه حذف شود؟">حذف درخواست</ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}
