"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db, schema } from "@/db";
import { LEAD_STATUSES, type LeadStatus } from "@/db/schema";
import { int, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";

export async function updateLead(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const status = str(form, "status") as LeadStatus;
  if (!LEAD_STATUSES.includes(status)) redirect(`/admin/leads/${id}?error=${encodeURIComponent("وضعیت نامعتبر است.")}`);
  await db
    .update(schema.leads)
    .set({ status, adminNote: str(form, "adminNote", 5000), updatedAt: new Date() })
    .where(eq(schema.leads.id, id));
  redirect(`/admin/leads/${id}?ok=${encodeURIComponent("ذخیره شد.")}`);
}

export async function deleteLead(form: FormData) {
  await requireAdmin();
  await db.delete(schema.leads).where(eq(schema.leads.id, int(form, "id")));
  redirect(`/admin/leads?ok=${encodeURIComponent("درخواست حذف شد.")}`);
}
