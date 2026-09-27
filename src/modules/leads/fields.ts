// Validation of the contact details every public lead form collects.

import { z } from "zod";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (d) => {
    const p = PERSIAN_DIGITS.indexOf(d);
    return String(p >= 0 ? p : ARABIC_DIGITS.indexOf(d));
  });
}

export const nameField = z.string().trim().min(2, "نام و نام خانوادگی را وارد کنید.").max(120, "نام بیش از حد طولانی است.");

export const phoneField = z
  .string()
  .transform((v) => normalizeDigits(v).replace(/[\s\-()]/g, ""))
  .refine((v) => v.length > 0, "شماره تماس را وارد کنید.")
  .refine((v) => /^\+?\d{8,15}$/.test(v), "شماره تماس معتبر نیست.");

export const businessField = z.string().trim().max(160).default("");
