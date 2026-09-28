// Validation and text helpers used by the lead forms, contracts and menus.
import assert from "node:assert/strict";
import { test } from "node:test";

import { decodeSlug, formatPhone, phoneDigits, phoneE164, plainText } from "../../src/lib/utils.ts";
import { numberToWords, tomanInWords } from "../../src/modules/contracts/words.ts";
import { nameField, normalizeDigits, phoneField } from "../../src/modules/leads/fields.ts";
import { cleanMenuUrl, normalizeMenu } from "../../src/modules/menus/normalize.ts";

test("contract amounts in Persian words", () => {
  const cases = {
    0: "صفر",
    11: "یازده",
    21: "بیست و یک",
    101: "صد و یک",
    1000: "هزار",
    1001: "هزار و یک",
    2000: "دو هزار",
    1_000_000: "یک میلیون",
    1_001_000: "یک میلیون و هزار",
    1_500_000: "یک میلیون و پانصد هزار",
    15_000_000: "پانزده میلیون",
    1_234_567: "یک میلیون و دویست و سی و چهار هزار و پانصد و شصت و هفت",
    1_000_000_000: "یک میلیارد",
  };
  for (const [n, words] of Object.entries(cases)) assert.equal(numberToWords(Number(n)), words, n);
  assert.equal(numberToWords(12.9), "دوازده", "fractions are dropped");
  assert.equal(numberToWords(-5), "منفی پنج");
  assert.equal(numberToWords(Number.NaN), "");
  assert.equal(tomanInWords(25_000_000), "بیست و پنج میلیون تومان");
});

test("phone field: Persian/Arabic digits and separators normalised, junk refused", () => {
  assert.equal(phoneField.parse("۰۹۱۲ ۳۴۵-۶۷۸۹"), "09123456789");
  assert.equal(phoneField.parse("٠٩١٢٣٤٥٦٧٨٩"), "09123456789");
  assert.equal(phoneField.parse("+98 (912) 345 6789"), "+989123456789");
  for (const bad of ["", "   ", "12345", "0912abc4567", "0".repeat(16)]) assert.equal(phoneField.safeParse(bad).success, false, JSON.stringify(bad));
  assert.equal(normalizeDigits("۱۲٣"), "123");
});

test("name field: trimmed, whitespace-only and over-long refused, Persian and emoji kept", () => {
  assert.equal(nameField.parse("  علی رضایی  "), "علی رضایی");
  assert.equal(nameField.parse("مریم 🌷"), "مریم 🌷");
  assert.equal(nameField.safeParse("   ").success, false);
  assert.equal(nameField.safeParse("ا").success, false);
  assert.equal(nameField.safeParse("ا".repeat(121)).success, false);
});

test("phone display and tel: links", () => {
  assert.equal(phoneDigits("۰۹۱۲-۴۶۰-۷۶۳۰"), "09124607630");
  assert.equal(phoneE164("09124607630"), "+989124607630");
  assert.equal(phoneE164("0098 912 460 7630"), "+989124607630");
  assert.equal(phoneE164("021-12345678"), "+982112345678");
  assert.equal(formatPhone("09124607630"), "0912 460 7630");
  assert.equal(formatPhone("02112345678"), "021 1234 5678");
});

test("slugs and titles", () => {
  assert.equal(decodeSlug("%D9%86%D9%85%D9%88%D9%86%D9%87"), "نمونه");
  assert.equal(decodeSlug("%E0%A4%A"), "%E0%A4%A", "a broken escape is returned as is");
  assert.equal(plainText("طراحی *سایت* و *سئو*"), "طراحی سایت و سئو");
});

test("menu links can never run script", () => {
  assert.equal(cleanMenuUrl("javascript:alert(1)"), "/javascript:alert(1)");
  assert.equal(cleanMenuUrl(" JavaScript:alert(1)"), "/JavaScript:alert(1)");
  assert.equal(cleanMenuUrl("data:text/html,x"), "/data:text/html,x");
  assert.equal(cleanMenuUrl("example.com/a"), "https://example.com/a");
  assert.equal(cleanMenuUrl("/services"), "/services");
  assert.equal(cleanMenuUrl("#faq"), "#faq");
  assert.equal(cleanMenuUrl("tel:0912"), "tel:0912");
});

test("menu trees are validated: labels required, depth and size limited, ids unique", () => {
  const menu = normalizeMenu([
    { id: "a", label: "خدمات", url: "/services", children: [{ id: "a", label: "سئو", url: "/seo", children: [{ label: "عمیق", url: "/x", children: [{ label: "خیلی عمیق", url: "/y" }] }] }] },
    { label: "", url: "/empty" },
    "garbage",
  ]);
  assert.equal(menu.length, 1);
  const ids = [];
  const walk = (items, depth) => {
    for (const item of items) {
      ids.push(item.id);
      assert.ok(depth <= 3, "depth limited");
      walk(item.children ?? [], depth + 1);
    }
  };
  walk(menu, 1);
  assert.equal(new Set(ids).size, ids.length, "ids unique");
  assert.deepEqual(normalizeMenu("not a list"), []);
});
