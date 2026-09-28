// Business rules of the pricing calculator: the submit action recomputes the
// estimate with these functions, so they decide what a lead is quoted.
import assert from "node:assert/strict";
import { test } from "node:test";

import { computeEstimate, initialChoices, isCountOnly } from "../../src/modules/pricing/estimate.ts";
import { formatPrice, formatTotal, parseAmount, parseDigits } from "../../src/modules/pricing/format.ts";
import { cleanPrice, normalizeSelection, normalizeServicePricing } from "../../src/modules/pricing/normalize.ts";
import { PRICE_MAX, QTY_LIMIT } from "../../src/modules/pricing/types.ts";

const pricing = normalizeServicePricing({
  plans: [
    { id: "basic", name: "پایه", price: 20_000_000, period: "یک‌بار" },
    { id: "custom", name: "سفارشی", price: 0 },
  ],
  groups: [
    { id: "type", type: "single", title: "نوع سایت", required: true, options: [{ id: "corp", label: "شرکتی", price: 10_000_000 }, { id: "shop", label: "فروشگاهی", price: 25_000_000 }] },
    { id: "pages", type: "quantity", title: "تعداد صفحه", unitLabel: "صفحه", unitPrice: 500_000, min: 1, max: 50, defaultQty: 5 },
    { id: "extras", type: "multi", title: "امکانات", options: [{ id: "blog", label: "وبلاگ", price: 3_000_000 }, { id: "chat", label: "چت", price: 0 }] },
    { id: "articles", type: "quantity", title: "تعداد مقاله", unitLabel: "مقاله", unitPrice: 0, min: 0, max: 100, defaultQty: 0 },
    { id: "level", type: "single", title: "سطح مقاله", options: [{ id: "std", label: "استاندارد", price: 400_000 }], perUnitOf: "articles" },
  ],
});

test("nothing picked: the required group is reported, no total", () => {
  const r = computeEstimate(pricing, { planId: null, choices: {} });
  assert.equal(r.errors.type, "«نوع سایت» را انتخاب کنید.");
  // Default quantities still count (5 pages).
  assert.deepEqual(r.items.map((i) => [i.group, i.amount]), [["تعداد صفحه", 2_500_000]]);
});

test("one option plus default quantity", () => {
  const r = computeEstimate(pricing, { planId: null, choices: { type: "corp" } });
  assert.deepEqual(r.errors, {});
  assert.equal(r.total, 10_000_000 + 5 * 500_000);
  assert.equal(r.negotiable, false);
});

test("combination: single + quantity + multi, with a negotiable (0) option", () => {
  const r = computeEstimate(pricing, { planId: null, choices: { type: "shop", pages: 12, extras: ["blog", "chat"] } });
  assert.equal(r.total, 25_000_000 + 12 * 500_000 + 3_000_000);
  assert.equal(r.negotiable, true, "«چت» has no price yet");
  assert.equal(r.items.length, 4);
});

test("per-unit pricing multiplies by the count group, which gets no line of its own", () => {
  const r = computeEstimate(pricing, { planId: null, choices: { type: "corp", articles: 8, level: "std" } });
  const article = r.items.find((i) => i.group === "سطح مقاله");
  assert.deepEqual([article.qty, article.unitPrice, article.amount], [8, 400_000, 3_200_000]);
  assert.ok(!r.items.some((i) => i.group === "تعداد مقاله"));
  assert.equal(isCountOnly(pricing.groups[3], pricing.groups), true);
  // Zero articles: the per-article option adds nothing.
  assert.ok(!computeEstimate(pricing, { planId: null, choices: { type: "corp", articles: 0, level: "std" } }).items.some((i) => i.group === "سطح مقاله"));
});

test("quantity boundaries: min and max accepted, outside rejected, fractions rejected", () => {
  assert.deepEqual(computeEstimate(pricing, { planId: null, choices: { type: "corp", pages: 1 } }).errors, {});
  assert.deepEqual(computeEstimate(pricing, { planId: null, choices: { type: "corp", pages: 50 } }).errors, {});
  for (const bad of [0, 51, -3, 2.5]) {
    const r = computeEstimate(pricing, { planId: null, choices: { type: "corp", pages: bad } });
    assert.match(r.errors.pages ?? "", /باید بین/, `pages=${bad}`);
    assert.ok(!r.items.some((i) => i.group === "تعداد صفحه"), `pages=${bad} adds nothing`);
  }
});

test("toggling: repeated and unknown ids change nothing, single keeps one option", () => {
  const once = computeEstimate(pricing, { planId: null, choices: { type: "corp", extras: ["blog"] } });
  const twice = computeEstimate(pricing, { planId: null, choices: { type: "corp", extras: ["blog", "blog", "nope"] } });
  assert.equal(twice.total, once.total);
  const off = computeEstimate(pricing, { planId: null, choices: { type: "corp", extras: [] } });
  assert.equal(once.total - off.total, 3_000_000);
  assert.equal(computeEstimate(pricing, { planId: null, choices: { type: ["corp", "shop"] } }).errors.type, "«نوع سایت» را انتخاب کنید.", "an array is not a single choice");
});

test("a plan is the whole estimate; a removed plan is an error", () => {
  const r = computeEstimate(pricing, { planId: "basic", choices: { type: "shop", pages: 40 } });
  assert.deepEqual(r.items, [{ group: "پلن", label: "پایه (یک‌بار)", qty: 1, unitPrice: 20_000_000, amount: 20_000_000 }]);
  assert.equal(r.total, 20_000_000);
  assert.equal(computeEstimate(pricing, { planId: "custom", choices: {} }).negotiable, true);
  assert.ok(computeEstimate(pricing, { planId: "gone", choices: {} }).errors.plan);
});

test("an empty calculator asks for a choice", () => {
  const empty = normalizeServicePricing({ groups: [{ id: "x", type: "multi", title: "امکانات", options: [{ id: "a", label: "الف", price: 1 }] }] });
  assert.ok(computeEstimate(empty, { planId: null, choices: {} }).errors.empty);
});

test("initial choices are the default quantities", () => {
  assert.deepEqual(initialChoices(pricing), { pages: 5, articles: 0 });
});

test("totals stay safe integers at the configured limits", () => {
  const big = normalizeServicePricing({
    groups: [{ id: "q", type: "quantity", title: "حداکثر", unitPrice: PRICE_MAX * 10, min: 0, max: QTY_LIMIT * 10, defaultQty: QTY_LIMIT }],
  });
  assert.equal(big.groups[0].unitPrice, PRICE_MAX);
  assert.equal(big.groups[0].max, QTY_LIMIT);
  const r = computeEstimate(big, { planId: null, choices: { q: QTY_LIMIT } });
  assert.ok(Number.isSafeInteger(r.total));
  assert.equal(r.total, PRICE_MAX * QTY_LIMIT);
});

test("normalizing config: ids unique and safe, prices clamped, empty entries dropped", () => {
  const n = normalizeServicePricing({
    plans: [{ name: "" }, { id: "p", name: "یک" }, { id: "p", name: "دو" }, { id: "__proto__", name: "سه" }],
    groups: [{ id: "g", type: "weird", title: "  عنوان   با فاصله  ", min: 9, max: 3, options: [{ label: "" }, { id: "o", label: "گزینه", price: -5 }] }],
  });
  assert.deepEqual(n.plans.map((p) => p.id), ["p", "plan1", "plan2"]);
  const g = n.groups[0];
  assert.equal(g.type, "single");
  assert.equal(g.title, "عنوان با فاصله");
  assert.deepEqual([g.min, g.max], [3, 9]);
  assert.deepEqual(g.options.map((o) => [o.id, o.price]), [["o", 0]]);
  assert.equal(cleanPrice("12abc"), 12);
  assert.equal(cleanPrice(Number.NaN), 0);
  // Normalizing twice gives the same result (page and submit action agree).
  assert.deepEqual(normalizeServicePricing(n), n);
});

test("normalizing a posted selection drops unsafe keys and values", () => {
  const s = normalizeSelection({
    planId: "<script>",
    choices: { type: "corp", __proto__x: "a", "bad key": "x", toString: "x", pages: 7.9, extras: ["blog", "<b>", 3], n: Number.POSITIVE_INFINITY },
  });
  assert.equal(s.planId, null);
  assert.deepEqual(s.choices, { type: "corp", __proto__x: "a", pages: 7, extras: ["blog"] });
  assert.deepEqual(normalizeSelection("garbage"), { planId: null, choices: {} });
});

test("money formatting and parsing", () => {
  assert.equal(formatPrice(0), "توافقی");
  assert.equal(formatPrice(1_500_000), "۱٬۵۰۰٬۰۰۰ تومان");
  assert.equal(formatTotal(0), "برآورد پس از بررسی");
  assert.equal(parseAmount("۱,۵۰۰,۰۰۰"), 1_500_000);
  assert.equal(parseAmount(""), 0);
  assert.equal(parseDigits("۱۲a3"), 123);
  assert.equal(parseDigits("abc"), null);
});
