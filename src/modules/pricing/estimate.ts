// Price calculation shared by the calculator (live total) and the submit
// action, which recomputes everything from the current config.

import type { EstimateItem } from "@/db/schema";

import { formatNumber } from "./format";
import type { EstimateSelection, PricingGroup, ServicePricing } from "./types";

export type EstimateResult = {
  items: EstimateItem[];
  total: number;
  /** Some picked items have no price yet («توافقی»), so the total is only part of the cost. */
  negotiable: boolean;
  /** Problems keyed by group id; `plan` and `empty` concern the whole estimate. */
  errors: Record<string, string>;
};

/** The calculator's starting state: every quantity at its default. */
export function initialChoices(pricing: ServicePricing): EstimateSelection["choices"] {
  const choices: EstimateSelection["choices"] = {};
  for (const g of pricing.groups) if (g.type === "quantity") choices[g.id] = g.defaultQty;
  return choices;
}

/**
 * A quantity group without its own price that another group multiplies by
 * (e.g. «تعداد مقاله» for a per-article price) only sets a count, so it gets
 * no line of its own.
 */
export function isCountOnly(group: PricingGroup, groups: PricingGroup[]) {
  return group.type === "quantity" && group.unitPrice === 0 && groups.some((g) => g.type !== "quantity" && g.perUnitOf === group.id);
}

function pick(choices: EstimateSelection["choices"], id: string) {
  return Object.hasOwn(choices, id) ? choices[id] : undefined;
}

function result(items: EstimateItem[], errors: Record<string, string>): EstimateResult {
  return {
    items,
    total: items.reduce((sum, item) => sum + item.amount, 0),
    negotiable: items.some((item) => item.amount === 0),
    errors,
  };
}

/**
 * Items and total for a selection. A plan is a ready package: when one is
 * picked it is the whole estimate. Otherwise every group adds its picks;
 * required single groups and quantity bounds are validated.
 */
export function computeEstimate(pricing: ServicePricing, selection: EstimateSelection): EstimateResult {
  const items: EstimateItem[] = [];
  const errors: Record<string, string> = {};

  if (selection.planId) {
    const plan = pricing.plans.find((p) => p.id === selection.planId);
    if (plan) {
      const label = plan.period ? `${plan.name} (${plan.period})` : plan.name;
      items.push({ group: "پلن", label, qty: 1, unitPrice: plan.price, amount: plan.price });
    } else {
      errors.plan = "پلن انتخاب‌شده دیگر موجود نیست؛ لطفاً صفحه را دوباره باز کنید.";
    }
    return result(items, errors);
  }

  const counts = new Map<string, number>();
  for (const g of pricing.groups) {
    if (g.type !== "quantity") continue;
    const value = pick(selection.choices, g.id);
    const qty = typeof value === "number" ? value : g.defaultQty;
    if (Number.isInteger(qty) && qty >= g.min && qty <= g.max) {
      counts.set(g.id, qty);
    } else {
      counts.set(g.id, 0);
      errors[g.id] = `«${g.title}» باید بین ${formatNumber(g.min)} و ${formatNumber(g.max)} باشد.`;
    }
  }

  for (const g of pricing.groups) {
    if (g.type === "quantity") {
      const qty = counts.get(g.id) ?? 0;
      if (qty > 0 && !isCountOnly(g, pricing.groups)) {
        const label = g.unitLabel ? `${formatNumber(qty)} ${g.unitLabel}` : formatNumber(qty);
        items.push({ group: g.title, label, qty, unitPrice: g.unitPrice, amount: qty * g.unitPrice });
      }
      continue;
    }

    const value = pick(selection.choices, g.id);
    const ids = g.type === "single" ? (typeof value === "string" ? [value] : []) : Array.isArray(value) ? value : [];
    const picked = g.options.filter((o) => ids.includes(o.id)).slice(0, g.type === "single" ? 1 : undefined);
    if (g.type === "single" && g.required && g.options.length > 0 && picked.length === 0) {
      errors[g.id] = `«${g.title}» را انتخاب کنید.`;
      continue;
    }
    const qty = g.perUnitOf ? (counts.get(g.perUnitOf) ?? 0) : 1;
    if (qty === 0) continue;
    for (const o of picked) items.push({ group: g.title, label: o.label, qty, unitPrice: o.price, amount: qty * o.price });
  }

  if (items.length === 0 && Object.keys(errors).length === 0) {
    errors.empty = "حداقل یکی از گزینه‌ها یا پلن‌ها را انتخاب کنید.";
  }
  return result(items, errors);
}
