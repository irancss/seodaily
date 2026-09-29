// Measurement events: only whitelisted, short, non-personal fields reach dataLayer.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { ctaTarget, toDataLayer, track, trackOnce } from "../../src/lib/analytics.ts";

beforeEach(() => {
  globalThis.window = {};
});

test("an event keeps exactly its allowed fields", () => {
  assert.deepEqual(toDataLayer({ event: "generate_lead", form: "estimate", service: "seo", estimate_total_toman: 12_500_000.4 }), {
    event: "generate_lead",
    form: "estimate",
    service: "seo",
    estimate_total_toman: 12_500_000,
  });
});

test("personal data cannot pass, even if a caller slips it in", () => {
  const out = toDataLayer({ event: "generate_lead", form: "contact", service: "seo", name: "علی رضایی", phone: "09121234567", email: "a@b.c", message: "hi" });
  assert.deepEqual(Object.keys(out).sort(), ["event", "form", "service"]);
});

test("values that are not short plain tokens are dropped", () => {
  const out = toDataLayer({ event: "cta_click", placement: "hero section", target: "x".repeat(41), service: "09121234567@x", estimate_total_toman: Number.NaN });
  assert.deepEqual(out, { event: "cta_click" });
});

test("track pushes to window.dataLayer, creating it when missing", () => {
  track({ event: "phone_click", placement: "floating" });
  track({ event: "form_start", form: "contact" });
  assert.deepEqual(window.dataLayer, [
    { event: "phone_click", placement: "floating" },
    { event: "form_start", form: "contact" },
  ]);
});

test("trackOnce sends once per scope and key", () => {
  const view = {};
  const other = {};
  trackOnce(view, "form_start", { event: "form_start", form: "contact" });
  trackOnce(view, "form_start", { event: "form_start", form: "contact" });
  trackOnce(view, "pricing_start", { event: "pricing_start", service: "seo" });
  trackOnce(other, "form_start", { event: "form_start", form: "contact" });
  assert.deepEqual(
    window.dataLayer.map((e) => e.event),
    ["form_start", "pricing_start", "form_start"],
  );
});

test("CTA links: contact and pricing pages, not the page you are on", () => {
  assert.equal(ctaTarget("/contact", "/"), "contact");
  assert.equal(ctaTarget("/contact?service=seo", "/services/seo"), "contact");
  assert.equal(ctaTarget("/pricing#seo", "/"), "pricing");
  assert.equal(ctaTarget("/pricing/", "/about"), "pricing");
  assert.equal(ctaTarget("/pricing/seo", "/seo"), "pricing");
  assert.equal(ctaTarget("/pricing/web-design#pricing-services", "/web-design"), "pricing");
  assert.equal(ctaTarget("/pricing/content", "/blog"), "pricing");
  assert.equal(ctaTarget("/pricing/seo#pricing-services", "/pricing/seo"), null);
  assert.equal(ctaTarget("/pricing/unknown", "/"), null);
  assert.equal(ctaTarget("/pricing?service=seo", "/pricing"), null);
  assert.equal(ctaTarget("#estimate-seo", "/pricing"), null);
  assert.equal(ctaTarget("/contacts", "/"), null);
  assert.equal(ctaTarget("/services/seo", "/"), null);
  assert.equal(ctaTarget("https://evil.example/contact", "/"), null);
});
