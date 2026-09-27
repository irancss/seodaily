import type { EstimateItem } from "@/db/schema";
import { PRICE_MAX, QTY_LIMIT } from "@/modules/pricing/types";

const ITEMS_MAX = 50;
const AMOUNT_MAX = PRICE_MAX * QTY_LIMIT;

function whole(value: unknown, max: number) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.trunc(n))) : 0;
}

/**
 * Validates estimate lines edited in the admin panel. A quantity and unit
 * price (from the calculator) are kept only while they still multiply to the
 * amount; an edited line becomes 1 × amount.
 */
export function normalizeEstimateItems(input: unknown): EstimateItem[] {
  if (!Array.isArray(input)) return [];
  const items: EstimateItem[] = [];
  for (const raw of input.slice(0, ITEMS_MAX * 2)) {
    if (!raw || typeof raw !== "object" || items.length >= ITEMS_MAX) continue;
    const r = raw as Record<string, unknown>;
    const label = String(r.label ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
    if (!label) continue;
    const group = String(r.group ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    const amount = whole(r.amount, AMOUNT_MAX);
    const qty = whole(r.qty, QTY_LIMIT);
    const unitPrice = whole(r.unitPrice, PRICE_MAX);
    items.push(
      qty >= 1 && qty * unitPrice === amount
        ? { group, label, qty, unitPrice, amount }
        : { group, label, qty: 1, unitPrice: amount, amount },
    );
  }
  return items;
}

export function sumItems(items: EstimateItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/** Same lines in the same order (key order does not matter; jsonb reorders keys). */
export function sameItems(a: EstimateItem[], b: EstimateItem[]) {
  return (
    a.length === b.length &&
    a.every((x, i) => x.group === b[i].group && x.label === b[i].label && x.qty === b[i].qty && x.unitPrice === b[i].unitPrice && x.amount === b[i].amount)
  );
}

/** How a line reads in tables and contracts, e.g. «نوع سایت: فروشگاه اینترنتی». */
export function itemTitle(item: EstimateItem) {
  return item.group ? `${item.group}: ${item.label}` : item.label;
}
