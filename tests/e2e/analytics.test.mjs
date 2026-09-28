// Lead-intent clicks reach window.dataLayer with where they happened, and no
// tag is loaded while no GTM ID is set. Read-only, so it is also safe against
// Production:
//   BASE_URL=https://seodaily.ir node --test tests/e2e/analytics.test.mjs
// The form conversions (form_start, generate_lead) write leads and are
// checked in journeys.test.mjs.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { chromium } from "playwright-core";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

let browser;
before(async () => {
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});
after(() => browser?.close());

/** The site's own events, without GTM's internal ones. */
const events = (page) => page.evaluate(() => (window.dataLayer ?? []).filter((e) => !String(e.event).startsWith("gtm.")));

async function open(path, viewport) {
  const mobile = viewport.width < 1024;
  const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  // Keep the browser from handing tel: links to the system (runs after the site's capture listener).
  await page.evaluate(() =>
    document.addEventListener("click", (e) => {
      if (e.target instanceof Element && e.target.closest('a[href^="tel:"]')) e.preventDefault();
    }),
  );
  return page;
}

test("phone clicks: one event each, with their placement", async () => {
  const page = await open("/", { width: 390, height: 844 });
  const floating = page.locator("a.fab-call");
  if ((await floating.count()) === 0) {
    // No phone configured: nothing to click, and nothing may be sent.
    assert.deepEqual(await events(page), []);
    return page.context().close();
  }
  await floating.click();
  await page.locator('footer a[href^="tel:"]').first().click();
  assert.deepEqual(await events(page), [
    { event: "phone_click", placement: "floating" },
    { event: "phone_click", placement: "footer" },
  ]);
  await page.context().close();
});

test("CTA clicks towards contact: event with placement, survives client navigation", async () => {
  const page = await open("/", { width: 1280, height: 900 });
  await page.locator('main > section:first-child a[href="/contact"]').first().click();
  await page.waitForURL(/\/contact$/);
  assert.deepEqual(await events(page), [{ event: "cta_click", placement: "hero", target: "contact" }]);

  // The closing call-to-action block of the pages has its own placement.
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.locator('[data-placement="cta"] a[href="/contact"]').first().click();
  await page.waitForURL(/\/contact$/);
  assert.deepEqual((await events(page)).at(-1), { event: "cta_click", placement: "cta", target: "contact" });

  // A link to the page you are already on is not intent.
  const selfLink = page.locator('a[href="/contact"]').first();
  await selfLink.evaluate((a) => a.click());
  assert.equal((await events(page)).length, 1, "only the CTA click after the reload");
  await page.context().close();
});

test("at most one GTM install, none without an ID; typed values never sent", async () => {
  const page = await open("/contact", { width: 1280, height: 900 });
  const tags = await page.evaluate(() => {
    const scripts = [...document.scripts];
    return {
      loader: scripts.filter((s) => s.id === "gtm").length,
      gtmJs: scripts.filter((s) => s.src.includes("googletagmanager.com/gtm.js")).length,
      google: scripts.filter((s) => /googletagmanager|google-analytics/.test(s.src + s.textContent)).length,
    };
  });
  assert.ok(tags.loader <= 1 && tags.gtmJs <= 1, `duplicate GTM install: ${JSON.stringify(tags)}`);
  if (tags.loader === 0) assert.equal(tags.google, 0, "no Google script while no container is configured");
  await page.fill("#cf-name", "نام آزمایشی");
  const json = JSON.stringify(await events(page));
  assert.ok(!json.includes("نام آزمایشی"), "typed values never reach dataLayer");
  assert.deepEqual(await events(page), [{ event: "form_start", form: "contact" }]);
  await page.context().close();
});

test("campaign parameters survive the site's own redirects", async () => {
  for (const [from, to] of [
    ["/seo/?utm_source=test&utm_medium=cpc&utm_campaign=a", "/seo?utm_source=test&utm_medium=cpc&utm_campaign=a"],
    ["/services/seo/?gclid=abc", "/services/seo?gclid=abc"],
  ]) {
    const res = await fetch(BASE + from, { redirect: "manual" });
    assert.ok([301, 308].includes(res.status), `${from}: ${res.status}`);
    assert.equal(new URL(res.headers.get("location"), BASE).href, new URL(to, BASE).href);
  }
});
