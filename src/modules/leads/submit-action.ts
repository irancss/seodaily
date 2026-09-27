"use server";

import { z } from "zod";

import { db, schema } from "@/db";
import { SERVICE_CHOICES } from "@/db/schema";
import { businessField, nameField, phoneField } from "@/modules/leads/fields";
import { clientIp, RATE_LIMIT_MESSAGE, rateLimited } from "@/modules/leads/rate-limit";
import { getGeneral } from "@/modules/settings/queries";

export type ContactState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "website" | "service" | "description", string>>;
  values?: Record<string, string>;
};

const schemaInput = z.object({
  name: nameField,
  phone: phoneField,
  business: businessField,
  website: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^(https?:\/\/)?[^\s/$.?#]+\.[^\s]+$/i.test(v), "آدرس وب‌سایت معتبر نیست.")
    .default(""),
  service: z.enum(SERVICE_CHOICES, { message: "نوع خدمت را انتخاب کنید." }),
  budget: z.string().trim().max(120).default(""),
  description: z.string().trim().max(4000, "توضیح پروژه حداکثر ۴۰۰۰ کاراکتر باشد.").default(""),
});

export async function submitConsultation(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(
    ["name", "phone", "business", "website", "service", "budget", "description"].map((k) => [
      k,
      String(formData.get(k) ?? ""),
    ]),
  );

  // Bots fill every field, including this invisible one.
  if (String(formData.get("company_fax") ?? "") !== "") {
    return { status: "success" };
  }

  if (rateLimited(await clientIp())) {
    return { status: "error", message: RATE_LIMIT_MESSAGE, values: raw };
  }

  const parsed = schemaInput.safeParse(raw);
  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["errors"]>;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { status: "error", message: "لطفاً خطاهای فرم را برطرف کنید.", errors, values: raw };
  }

  const data = parsed.data;
  const { budgets } = await getGeneral();
  const budget = budgets.includes(data.budget) ? data.budget : "";

  try {
    await db.insert(schema.leads).values({
      name: data.name,
      phone: data.phone,
      business: data.business,
      website: data.website,
      service: data.service,
      budget,
      description: data.description,
    });
  } catch (error) {
    console.error("contact: could not save lead", error);
    return {
      status: "error",
      message: "ارسال درخواست با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.",
      values: raw,
    };
  }

  return { status: "success" };
}
