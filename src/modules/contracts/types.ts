// Contract templates (one per pricing service) and the company details printed
// in them. Safe to import anywhere.

import type { PricingService } from "@/modules/pricing/types";

export type ContractCompany = {
  /** Legal or trade name of the provider. */
  name: string;
  address: string;
  phone: string;
  signatory: string;
  signatoryTitle: string;
  nationalId: string;
  registrationNo: string;
};

export type ContractSettings = {
  company: ContractCompany;
  templates: Record<PricingService, string>;
  /** Which templates were edited (the others show the sample text). */
  customized: Record<PricingService, boolean>;
};

export const TEMPLATE_MAX = 30_000;

/** Placeholders a template may contain, as listed next to the editor. */
export const CONTRACT_PLACEHOLDERS = [
  { key: "contract_no", label: "شماره قرارداد (سال و شماره درخواست)" },
  { key: "date", label: "تاریخ امروز به شمسی" },
  { key: "company_name", label: "نام مجری (شرکت)" },
  { key: "company_address", label: "نشانی مجری" },
  { key: "company_phone", label: "تلفن مجری" },
  { key: "company_national_id", label: "شناسه ملی مجری" },
  { key: "company_registration_no", label: "شماره ثبت مجری" },
  { key: "signatory", label: "نام صاحب امضای مجری" },
  { key: "signatory_title", label: "سمت صاحب امضا" },
  { key: "client_name", label: "نام کارفرما" },
  { key: "client_phone", label: "تلفن کارفرما" },
  { key: "client_business", label: "کسب‌وکار کارفرما" },
  { key: "service", label: "عنوان خدمت" },
  { key: "items_table", label: "جدول اقلام و مبالغ (در یک خط جدا)" },
  { key: "total", label: "مبلغ کل به عدد" },
  { key: "total_words", label: "مبلغ کل به حروف" },
  { key: "signatures", label: "محل امضای طرفین (در یک خط جدا)" },
] as const;

export type PlaceholderKey = (typeof CONTRACT_PLACEHOLDERS)[number]["key"];
/** Placeholders that stand for a whole block rather than text. */
export type BlockPlaceholder = Extract<PlaceholderKey, "items_table" | "signatures">;
export type TextPlaceholder = Exclude<PlaceholderKey, BlockPlaceholder>;
