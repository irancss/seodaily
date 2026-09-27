import { ConfirmButton, SubmitButton } from "@/components/atoms";
import { Card, Select } from "@/components/molecules";
import { LEAD_STATUSES, type Lead } from "@/db/schema";
import { deleteLead, updateLead } from "@/modules/leads/actions";
import { STATUS_LABELS } from "@/modules/leads/status";

/** Status + internal note form, plus the delete button, for one lead. */
export function LeadFollowupForm({ lead }: { lead: Lead }) {
  return (
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
  );
}
