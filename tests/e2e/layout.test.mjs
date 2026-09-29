// Responsive layout checks in a real browser. Read-only, so it is also safe
// against Production:
//   BASE_URL=https://seodaily.ir node --test tests/e2e/layout.test.mjs
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { chromium } from "playwright-core";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const PAGES = ["/", "/web-design", "/seo", "/services", "/services/technical-seo", "/pricing", "/pricing/web-design", "/pricing/seo", "/pricing/content", "/portfolio", "/blog", "/about", "/contact"];
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440];

let browser;
before(async () => {
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});
after(() => browser?.close());

for (const width of WIDTHS) {
  test(`${width}px: no horizontal scroll, no cut-off cards, one H1, no script errors`, async () => {
    const mobile = width < 1024;
    const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
    try {
      for (const path of PAGES) {
        const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
        assert.equal(res.status(), 200, `${path} status`);
        const layout = await page.evaluate(() => {
          const doc = document.documentElement;
          const cut = [...document.querySelectorAll(".float-card, .frame-glass, .glass-card, .badge-glass, .chip, .btn")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && getComputedStyle(el).visibility !== "hidden" && (r.left < -1 || r.right > doc.clientWidth + 1);
            })
            .map((el) => `${el.className.toString().split(" ").slice(0, 3).join(".")} [${Math.round(el.getBoundingClientRect().left)}]`);
          return { overflow: doc.scrollWidth - doc.clientWidth, cut, h1: document.querySelectorAll("h1").length };
        });
        assert.equal(layout.overflow, 0, `${path}: page scrolls sideways by ${layout.overflow}px`);
        assert.deepEqual(layout.cut, [], `${path}: cut off by the screen edge`);
        assert.equal(layout.h1, 1, `${path}: one H1`);
      }
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  });
}

test("the headings and text are drawn in Vazir, also on a slow connection", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  // ~400 ms round trips: with font-display "optional" the page used to keep the system font here.
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: 60_000, uploadThroughput: 60_000 });
  try {
    await page.goto(`${BASE}/services/technical-seo`, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(3000);
    const widths = await page.evaluate(() => {
      // The same text measured in the page's own font and in Vazir: equal widths mean Vazir is what is drawn.
      const measure = (el, family) => {
        const probe = document.createElement("span");
        probe.textContent = el.textContent;
        probe.style.cssText = `font:${getComputedStyle(el).font};font-family:${family};position:absolute;visibility:hidden;white-space:nowrap`;
        document.body.append(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return Math.round(width);
      };
      return ["h1", "main p", "header a"].map((selector) => {
        const el = document.querySelector(selector);
        return { selector, page: measure(el, getComputedStyle(el).fontFamily), vazir: measure(el, '"Vazir FD WOL"') };
      });
    });
    for (const w of widths) assert.equal(w.page, w.vazir, `${w.selector} is not drawn in Vazir`);
  } finally {
    await context.close();
  }
});

test("phones: the call button never sits on the start (right) side of RTL lines and hides while typing", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
    const fab = page.locator(".fab-call");
    const box = await fab.boundingBox();
    assert.ok(box && box.x + box.width < 390 / 2, "call button on the left");
    await page.focus("#cf-name");
    await page.waitForTimeout(300);
    assert.equal(await fab.evaluate((el) => getComputedStyle(el).opacity), "0", "hidden while a field is focused");
  } finally {
    await context.close();
  }
});
