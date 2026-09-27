"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db, schema } from "@/db";
import { LEAD_STATUSES, type LeadEstimate, type LeadStatus } from "@/db/schema";
import { failed, int, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { normalizeEstimateItems, sameItems, sumItems } from "@/modules/leads/estimate";
import { pricingServiceFor } from "@/modules/pricing/types";

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

/** Estimate lines typed by the admin (used by the contract); no lines removes the estimate. */
export async function saveLeadEstimate(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = `/admin/leads/${id}`;
  const lead = await db.query.leads.findFirst({ where: eq(schema.leads.id, id) });
  if (!lead) failed("/admin/leads", "درخواست پیدا نشد.");

  let raw: unknown = null;
  try {
    raw = JSON.parse(String(form.get("items") ?? ""));
  } catch {
    // rejected below
  }
  if (!Array.isArray(raw)) failed(back, "اقلام برآورد معتبر نیست.");

  const items = normalizeEstimateItems(raw);
  const current = lead.estimate;
  let estimate: LeadEstimate | null = null;
  if (items.length > 0) {
    // Saving the calculator's lines untouched keeps them marked as the visitor's estimate.
    const unchanged = current !== null && sameItems(current.items, items);
    estimate = unchanged
      ? current
      : { service: current?.service ?? pricingServiceFor(lead.service), items, total: sumItems(items), source: "manual" };
  }

  await db.update(schema.leads).set({ estimate, updatedAt: new Date() }).where(eq(schema.leads.id, id));
  redirect(`${back}?ok=${encodeURIComponent(estimate ? "برآورد ذخیره شد." : "برآورد حذف شد.")}`);
}
