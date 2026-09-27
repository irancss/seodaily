"use server";

import { z } from "zod";

import { db, schema } from "@/db";
import { failed, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { businessField, nameField, phoneField } from "@/modules/leads/fields";
import { clientIp, RATE_LIMIT_MESSAGE, rateLimited } from "@/modules/leads/rate-limit";
import { writeSetting } from "@/modules/settings/queries";

import { computeEstimate } from "./estimate";
import { normalizeSelection, normalizeServicePricing } from "./normalize";
import { getPricing, PRICING_SETTING_KEY, readStoredPricing } from "./queries";
import { isPricingService } from "./types";

function adminPath(service: string) {
  return `/admin/pricing?service=${service}`;
}

function parseJson(value: FormDataEntryValue | null, max: number): unknown {
  try {
    return JSON.parse(String(value ?? "").slice(0, max));
  } catch {
    return null;
  }
}

export async function savePricing(form: FormData) {
  await requireAdmin();
  const service = str(form, "service");
  if (!isPricingService(service)) failed("/admin/pricing", "خدمت نامعتبر است.");
  const config = parseJson(form.get("config"), 1_000_000);
  if (!config || typeof config !== "object" || Array.isArray(config)) failed(adminPath(service), "داده تعرفه معتبر نیست.");

  const stored = await readStoredPricing();
  await writeSetting(PRICING_SETTING_KEY, { ...stored, [service]: normalizeServicePricing(config) });
  saved(adminPath(service), "تعرفه‌ها ذخیره شد.");
}

export async function resetPricingService(form: FormData) {
  await requireAdmin();
  const service = str(form, "service");
  if (!isPricingService(service)) failed("/admin/pricing", "خدمت نامعتبر است.");
  // Without a stored value the service falls back to the default structure.
  const stored = await readStoredPricing();
  delete stored[service];
  await writeSetting(PRICING_SETTING_KEY, stored);
  saved(adminPath(service), "این خدمت به ساختار پیش‌فرض برگشت.");
}

export type EstimateState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "business" | "note", string>>;
  /** Calculator problems keyed by group id, shown next to the group. */
  groupErrors?: Record<string, string>;
  values?: Record<string, string>;
  /** Server-computed total of the saved estimate. */
  total?: number;
};

const contactInput = z.object({
  name: nameField,
  phone: phoneField,
  business: businessField,
  note: z.string().trim().max(2000, "توضیحات حداکثر ۲۰۰۰ کاراکتر باشد.").default(""),
});

/**
 * Saves a calculator estimate as a lead. Only the picked ids and counts come
 * from the browser; items and total are recomputed from the current config.
 */
export async function submitEstimate(_prev: EstimateState, form: FormData): Promise<EstimateState> {
  const values = Object.fromEntries(["name", "phone", "business", "note"].map((k) => [k, String(form.get(k) ?? "")]));

  // Bots fill every field, including this invisible one.
  if (String(form.get("company_fax") ?? "") !== "") return { status: "success" };

  const service = String(form.get("service") ?? "");
  if (!isPricingService(service)) return { status: "error", message: "خدمت انتخاب‌شده معتبر نیست.", values };

  const parsed = contactInput.safeParse(values);
  const errors: NonNullable<EstimateState["errors"]> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof errors;
      errors[key] ??= issue.message;
    }
  }

  const selection = normalizeSelection(parseJson(form.get("selection"), 20_000));
  const estimate = computeEstimate((await getPricing())[service], selection);
  const groupErrors = estimate.errors;

  if (!parsed.success || Object.keys(groupErrors).length > 0) {
    const message = parsed.success ? Object.values(groupErrors)[0] : "لطفاً خطاهای فرم را برطرف کنید.";
    return { status: "error", message, errors, groupErrors, values };
  }

  // Only valid submissions count towards the limit shared with the contact form.
  if (rateLimited(await clientIp())) return { status: "error", message: RATE_LIMIT_MESSAGE, values };

  const data = parsed.data;
  try {
    await db.insert(schema.leads).values({
      name: data.name,
      phone: data.phone,
      business: data.business,
      service,
      description: data.note,
      estimate: {
        service,
        ...(selection.planId ? { planId: selection.planId } : {}),
        items: estimate.items,
        total: estimate.total,
        source: "calculator",
      },
    });
  } catch (error) {
    console.error("pricing: could not save estimate", error);
    return { status: "error", message: "ثبت درخواست با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.", values };
  }

  return { status: "success", total: estimate.total };
}
