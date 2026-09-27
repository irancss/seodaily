// Pricing tables and calculators of the /pricing page, edited in the admin
// panel. Safe to import anywhere. All prices are integers in toman; 0 means
// «توافقی» (shown as such and left out of totals).

import type { LeadEstimate } from "@/db/schema";

export const PRICING_SERVICES = ["web-design", "seo", "content"] as const satisfies readonly LeadEstimate["service"][];
export type PricingService = (typeof PRICING_SERVICES)[number];

export const PRICING_SERVICE_LABELS: Record<PricingService, string> = {
  "web-design": "طراحی سایت",
  seo: "سئو",
  content: "تولید محتوا",
};

export function isPricingService(value: unknown): value is PricingService {
  return PRICING_SERVICES.includes(value as PricingService);
}

/** Pricing service (and contract template) for a lead's service choice. */
export function pricingServiceFor(choice: string): PricingService {
  return choice === "seo" || choice === "content" ? choice : "web-design";
}

export type PricingPlan = {
  id: string;
  name: string;
  price: number;
  /** e.g. «یک‌بار», «ماهانه». */
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
};

export type PricingOption = { id: string; label: string; price: number; description: string };

export const GROUP_TYPES = ["single", "multi", "quantity"] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  single: "تک‌انتخابی",
  multi: "چندانتخابی",
  quantity: "تعدادی",
};

/**
 * One calculator question. `single` and `multi` pick from `options`;
 * `quantity` is a number between `min` and `max` times `unitPrice`. The fields
 * of the other types are kept, so the admin can switch a group's type without
 * losing what was typed.
 */
export type PricingGroup = {
  id: string;
  type: GroupType;
  title: string;
  help: string;
  /** single: the visitor has to pick an option. */
  required: boolean;
  options: PricingOption[];
  /** single/multi: id of a quantity group whose count multiplies the option prices (e.g. price per article). */
  perUnitOf: string;
  /** quantity: e.g. «صفحه», «مقاله». */
  unitLabel: string;
  unitPrice: number;
  min: number;
  max: number;
  defaultQty: number;
};

export type ServicePricing = {
  intro: string;
  /** Shown under the calculator total, e.g. VAT or payment terms. */
  note: string;
  plans: PricingPlan[];
  groups: PricingGroup[];
};

export type PricingConfig = Record<PricingService, ServicePricing>;

/** What the visitor picked. Prices are always recomputed from the current config. */
export type EstimateSelection = {
  /** A plan is an alternative to the calculator: when set, `choices` are ignored. */
  planId: string | null;
  /** single → option id, multi → option ids, quantity → count; keyed by group id. */
  choices: Record<string, string | string[] | number>;
};

// Limits keep every possible total a safe integer.
export const PRICE_MAX = 10_000_000_000;
export const QTY_LIMIT = 1_000;
export const PLANS_MAX = 6;
export const GROUPS_MAX = 30;
export const OPTIONS_MAX = 30;
export const FEATURES_MAX = 15;
