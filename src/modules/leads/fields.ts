// Validation of the contact details every public lead form collects.

import { z } from "zod";

import { toLatinDigits } from "@/lib/utils";

export const normalizeDigits = toLatinDigits;

export const nameField = z.string().trim().min(2, "نام و نام خانوادگی را وارد کنید.").max(120, "نام بیش از حد طولانی است.");

export const phoneField = z
  .string()
  .transform((v) => normalizeDigits(v).replace(/[\s\-()]/g, ""))
  .refine((v) => v.length > 0, "شماره تماس را وارد کنید.")
  .refine((v) => /^\+?\d{8,15}$/.test(v), "شماره تماس معتبر نیست.");

export const businessField = z.string().trim().max(160).default("");
