import {
  FEATURES_MAX,
  GROUP_TYPES,
  GROUPS_MAX,
  OPTIONS_MAX,
  PLANS_MAX,
  PRICE_MAX,
  QTY_LIMIT,
  type EstimateSelection,
  type GroupType,
  type PricingGroup,
  type PricingOption,
  type PricingPlan,
  type ServicePricing,
} from "./types";

type Raw = Record<string, unknown>;

const ID_RE = /^[\w-]{1,40}$/;

/** Ids double as object keys, so names that exist on every object are refused. */
function reserved(id: string) {
  return id in Object.prototype;
}

function obj(value: unknown): Raw | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null;
}

function list(value: unknown, max: number): Raw[] {
  return Array.isArray(value) ? value.slice(0, max).map(obj).filter((v): v is Raw => v !== null) : [];
}

/** One line of text: whitespace collapsed, trimmed and cut to `max`. */
function line(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function text(value: unknown, max: number) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

function int(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function cleanPrice(value: unknown) {
  return int(value, 0, PRICE_MAX, 0);
}

/**
 * Hands out unique ids within one list. A missing, unsafe or duplicate id gets
 * a counter-based one, so normalising the same stored data twice gives the
 * same ids (the public page and the submit action must agree).
 */
function idMaker(prefix: string) {
  const seen = new Set<string>();
  let n = 0;
  return (value: unknown) => {
    let id = String(value ?? "").replace(/[^\w-]/g, "").slice(0, 40);
    while (!id || seen.has(id) || reserved(id)) id = `${prefix}${++n}`;
    seen.add(id);
    return id;
  };
}

function normalizePlans(input: unknown): PricingPlan[] {
  const nextId = idMaker("plan");
  const plans: PricingPlan[] = [];
  for (const raw of list(input, PLANS_MAX * 2)) {
    const name = line(raw.name, 80);
    if (!name || plans.length >= PLANS_MAX) continue;
    const features = typeof raw.features === "string" ? raw.features.split("\n") : Array.isArray(raw.features) ? raw.features : [];
    plans.push({
      id: nextId(raw.id),
      name,
      price: cleanPrice(raw.price),
      period: line(raw.period, 30),
      description: text(raw.description, 300),
      features: features.map((f) => line(f, 140)).filter(Boolean).slice(0, FEATURES_MAX),
      highlighted: raw.highlighted === true,
    });
  }
  return plans;
}

function normalizeOptions(input: unknown): PricingOption[] {
  const nextId = idMaker("opt");
  const options: PricingOption[] = [];
  for (const raw of list(input, OPTIONS_MAX * 2)) {
    const label = line(raw.label, 120);
    if (!label || options.length >= OPTIONS_MAX) continue;
    options.push({ id: nextId(raw.id), label, price: cleanPrice(raw.price), description: text(raw.description, 240) });
  }
  return options;
}

function normalizeGroups(input: unknown): PricingGroup[] {
  const nextId = idMaker("group");
  const groups: PricingGroup[] = [];
  for (const raw of list(input, GROUPS_MAX * 2)) {
    const title = line(raw.title, 100);
    if (!title || groups.length >= GROUPS_MAX) continue;
    const type: GroupType = GROUP_TYPES.includes(raw.type as GroupType) ? (raw.type as GroupType) : "single";
    let min = int(raw.min, 0, QTY_LIMIT, 0);
    let max = int(raw.max, 0, QTY_LIMIT, Math.max(min, 10));
    if (max < min) [min, max] = [max, min];
    max = Math.max(max, 1);
    groups.push({
      id: nextId(raw.id),
      type,
      title,
      help: text(raw.help, 300),
      required: raw.required === true,
      options: normalizeOptions(raw.options),
      perUnitOf: String(raw.perUnitOf ?? ""),
      unitLabel: line(raw.unitLabel, 30),
      unitPrice: cleanPrice(raw.unitPrice),
      min,
      max,
      defaultQty: int(raw.defaultQty, min, max, min),
    });
  }
  // A group can only be priced per unit of an existing quantity group.
  const quantityIds = new Set(groups.filter((g) => g.type === "quantity").map((g) => g.id));
  for (const g of groups) if (g.type === "quantity" || !quantityIds.has(g.perUnitOf)) g.perUnitOf = "";
  return groups;
}

/**
 * Validates an untrusted service config (from the admin form or the database):
 * drops entries without a name, trims texts, clamps prices and quantities and
 * makes every id unique and safe.
 */
export function normalizeServicePricing(input: unknown): ServicePricing {
  const raw = obj(input) ?? {};
  return {
    intro: text(raw.intro, 1000),
    note: text(raw.note, 300),
    plans: normalizePlans(raw.plans),
    groups: normalizeGroups(raw.groups),
  };
}

function safeId(value: unknown) {
  return typeof value === "string" && ID_RE.test(value) && !reserved(value) ? value : null;
}

/** The visitor's picks as posted by the calculator, reduced to well-formed ids and numbers. */
export function normalizeSelection(input: unknown): EstimateSelection {
  const raw = obj(input) ?? {};
  const choices: EstimateSelection["choices"] = {};
  for (const [key, value] of Object.entries(obj(raw.choices) ?? {}).slice(0, GROUPS_MAX * 2)) {
    if (!safeId(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) {
      choices[key] = Math.trunc(value);
    } else if (typeof value === "string") {
      const id = safeId(value);
      if (id) choices[key] = id;
    } else if (Array.isArray(value)) {
      choices[key] = value
        .slice(0, OPTIONS_MAX)
        .map(safeId)
        .filter((v): v is string => v !== null);
    }
  }
  return { planId: safeId(raw.planId), choices };
}
