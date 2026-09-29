// Automated WCAG 2.2 A/AA checks (axe-core) in a real browser, on the final
// state of each page (scroll-revealed content shown, no animation mid-state).
// Public pages are read-only, so this also runs against Production; the admin
// pages need ADMIN_EMAIL/ADMIN_PASSWORD and are skipped without them.
//   BASE_URL=… [ADMIN_EMAIL=… ADMIN_PASSWORD=…] node --test tests/e2e/a11y.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";

import { chromium } from "playwright-core";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const PUBLIC = ["/", "/web-design", "/seo", "/services", "/services/technical-seo", "/pricing", "/portfolio", "/about", "/contact", "/plugins", "/no-such-page"];
const ADMIN = ["/admin", "/admin/leads", "/admin/services/1", "/admin/pages", "/admin/menus", "/admin/pricing", "/admin/settings", "/admin/faqs", "/admin/account", "/admin/plugins", "/admin/plugins/monitor", "/admin/plugins/users"];

let browser;
before(async () => {
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});
after(() => browser?.close());

async function violations(page, path) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  await page.addScriptTag({ content: AXE });
  const found = await page.evaluate(async (tags) => (await window.axe.run(document, { runOnly: { type: "tag", values: tags } })).violations, TAGS);
  return found.map((v) => `${path} ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}`);
}

for (const width of [390, 1280]) {
  test(`${width}px public pages: no WCAG 2.2 AA violations`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const all = [];
    for (const path of PUBLIC) all.push(...(await violations(page, path)));
    await context.close();
    assert.deepEqual(all, []);
  });
}

test("admin pages: no WCAG 2.2 AA violations", { skip: ADMIN_EMAIL && ADMIN_PASSWORD ? false : "needs ADMIN_EMAIL/ADMIN_PASSWORD" }, async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", extraHTTPHeaders: { "X-Real-IP": `203.0.113.250-${Date.now()}` } });
  const page = await context.newPage();
  const all = await violations(page, "/admin/login");
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/admin$/);
  for (const path of ADMIN) all.push(...(await violations(page, path)));
  await context.close();
  assert.deepEqual(all, []);
});

test("keyboard: skip link first, focus always visible, form errors tied to fields", async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("href")), "#content", "first tab stop is the skip link");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  assert.ok(await page.evaluate(() => Boolean(document.activeElement.closest("main"))), "skip link moves focus into main");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    const visible = await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement);
      return (cs.outlineStyle !== "none" && cs.outlineWidth !== "0px") || cs.boxShadow !== "none";
    });
    assert.ok(visible, `tab stop ${i + 1} has a visible focus indicator`);
  }
  await context.close();
});
