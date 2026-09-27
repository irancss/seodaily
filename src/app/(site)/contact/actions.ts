"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { db, schema } from "@/db";
import { SERVICE_CHOICES } from "@/db/schema";
import { getGeneral } from "@/lib/settings";

export type ContactState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "website" | "service" | "description", string>>;
  values?: Record<string, string>;
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (d) => {
    const p = PERSIAN_DIGITS.indexOf(d);
    return String(p >= 0 ? p : ARABIC_DIGITS.indexOf(d));
  });
}

const schemaInput = z.object({
  name: z.string().trim().min(2, "نام و نام خانوادگی را وارد کنید.").max(120, "نام بیش از حد طولانی است."),
  phone: z
    .string()
    .transform((v) => normalizeDigits(v).replace(/[\s\-()]/g, ""))
    .refine((v) => v.length > 0, "شماره تماس را وارد کنید.")
    .refine((v) => /^\+?\d{8,15}$/.test(v), "شماره تماس معتبر نیست."),
  business: z.string().trim().max(160).default(""),
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

// Simple in-memory limiter: a handful of submissions per address per window.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

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

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) {
    return {
      status: "error",
      message: "تعداد درخواست‌ها زیاد است. لطفاً چند دقیقه بعد دوباره تلاش کنید.",
      values: raw,
    };
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
