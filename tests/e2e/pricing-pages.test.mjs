// Writes fixtures only to a disposable local database; restores the previous pricing.
import assert from "node:assert/strict";
import { test } from "node:test";
import postgres from "postgres";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(BASE).hostname)) throw new Error("Use a disposable local server.");
const services = ["web-design", "seo", "content"];

test("independent pricing routes, legacy redirects and sitemap", async () => {
  const hub = await (await fetch(`${BASE}/pricing`)).text();
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const titles = new Set();
  for (const service of services) {
    const path = `/pricing/${service}`;
    assert.ok(hub.includes(`href="${path}"`));
    assert.ok(sitemap.includes(path));
    const response = await fetch(`${BASE}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(`<link rel="canonical" href="https://seodaily.ir${path}"`));
    titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
    const old = await fetch(`${BASE}/pricing?service=${service}`, { redirect: "manual" });
    await old.arrayBuffer();
    assert.equal(old.status, 308);
    assert.equal(new URL(old.headers.get("location"), BASE).pathname, path);
  }
  assert.equal(titles.size, 3);
  const invalid = await fetch(`${BASE}/pricing/unknown`);
  await invalid.arrayBuffer();
  assert.equal(invalid.status, 404);
});

test("admin saves three SEO packages and a real table independently, including a second save", async () => {
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, CHROMIUM_PATH } = process.env;
  assert.ok(DATABASE_URL && ADMIN_EMAIL && ADMIN_PASSWORD);
  const sql = postgres(DATABASE_URL, { max: 1 });
  const backup = await sql`select value from settings where key = 'pricing'`;
  const browser = await chromium.launch(CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  const marker = `pricing-${Date.now()}`;
  try {
    await page.goto(`${BASE}/admin/login`);
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/admin$/);
    await page.goto(`${BASE}/admin/pricing?service=seo`);
    const initial = JSON.parse(await page.locator('input[name="config"]').inputValue());
    assert.equal(initial.plans.length, 0, "test database should have no SEO packages");
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "افزودن پلن", exact: true }).click();
      await page.getByLabel("نام پلن", { exact: true }).nth(i).fill(`${marker}-${i}`);
      await page.getByLabel("قیمت (تومان)", { exact: true }).nth(i).fill(String((i + 1) * 10000000));
      await page.getByLabel("دوره پرداخت", { exact: true }).nth(i).fill("ماهانه");
      await page.getByLabel("توضیح کوتاه", { exact: true }).nth(i).fill(`توضیح بسته ${i + 1}`);
      await page.getByLabel("ویژگی‌ها (هر خط یک مورد)", { exact: true }).nth(i).fill("بررسی فنی\nگزارش ماهانه");
    }
    await page.locator(".ProseMirror").fill(`توضیحات تعرفه ${marker}`);
    await page.getByRole("button", { name: "جدول", exact: true }).click();
    const cells = page.locator(".ProseMirror th p, .ProseMirror td p");
    await cells.first().waitFor();
    for (let i = 0; i < 9; i++) await cells.nth(i).fill(`مقایسه ${i + 1}`);
    await page.getByLabel("عنوان جدول", { exact: true }).fill("جدول مقایسه بسته‌های سئو");
    for (let save = 0; save < 2; save++) {
      await page.getByRole("button", { name: "ذخیره تعرفه سئو", exact: true }).click();
      await page.locator(".toast").filter({ hasText: "تعرفه‌ها ذخیره شد" }).first().waitFor();
      await page.reload();
      await page.locator(".ProseMirror table").waitFor();
      const stored = (await sql`select value from settings where key = 'pricing'`)[0].value;
      assert.equal(stored.seo.plans.length, 3);
      assert.deepEqual(stored.seo.plans.map((p) => p.price), [10000000, 20000000, 30000000]);
      assert.ok(JSON.stringify(stored.seo.content).includes(marker));
      for (const other of ["web-design", "content"]) assert.deepEqual(stored[other], backup[0]?.value?.[other]);
    }
    let html = "";
    const deadline = performance.now() + 20000;
    do {
      html = await (await fetch(`${BASE}/pricing/seo`)).text();
      if (html.includes(marker)) break;
      await new Promise((resolve) => setTimeout(resolve, 300));
    } while (performance.now() < deadline);
    assert.ok(html.includes(marker), "server HTML includes saved packages and body without JavaScript");
    assert.ok(html.includes("جدول مقایسه بسته‌های سئو"));
    await page.goto(`${BASE}/pricing/seo`);
    assert.equal(await page.locator(".block-table table").count(), 1);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: no page overflow`);
      await page.screenshot({ path: `/tmp/pricing-${width}.png`, fullPage: true });
    }
    assert.deepEqual(errors, []);
  } finally {
    if (backup.length) await sql`update settings set value = ${sql.json(backup[0].value)} where key = 'pricing'`;
    else await sql`delete from settings where key = 'pricing'`;
    await browser.close();
    await sql.end();
  }
});
