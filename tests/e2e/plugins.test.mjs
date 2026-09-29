// Plugin library end to end against the built app, its worker and a local
// fixture source (CI only; writes data, sends no real SMS):
//   BASE_URL, DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, SMS_TEST_OUTBOX
//   (the app and worker run with CI=true and PLUGIN_FETCH_ALLOW_PRIVATE_FOR_TESTS=127.0.0.1/32)
// Covers PL-T02, T08, T13, T16, T22–T24, T26, T30–T33 in a real browser.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import http from "node:http";
import { after, before, test } from "node:test";

import postgres from "postgres";
import { chromium } from "playwright-core";

import { pluginZip } from "../support/zip-builder.mjs";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const { ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL, SMS_TEST_OUTBOX } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !DATABASE_URL || !SMS_TEST_OUTBOX) throw new Error("Set ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL and SMS_TEST_OUTBOX.");
if (/seodaily\.ir/.test(BASE)) throw new Error("Writes data; never run against Production.");

const RUN = Date.now().toString(36);
const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
async function axe(page) {
  await page.addScriptTag({ content: AXE });
  const found = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations);
  return found.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
}
const SLUG = `e2e-plugin-${RUN}`;
const CAT = `e2e-cat-${RUN}`;
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
let browser, sql, fixture, fixtureBase;
const pageErrors = [];
let visitor = 0;

before(async () => {
  sql = postgres(DATABASE_URL, { max: 2 });
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const zip = pluginZip({ folder: "e2e-hello", name: "E2E Hello", version: "2.4.1" });
  fixture = http.createServer((req, res) => {
    if (req.url === "/plugin") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<html><body><h1>E2E Hello</h1><p>Version: 2.4.1</p><a href="/dl/e2e-hello-2.4.1.zip">Download</a></body></html>`);
    } else if (req.url === "/dl/e2e-hello-2.4.1.zip") {
      res.writeHead(200, { "content-type": "application/zip" });
      res.end(zip);
    } else res.writeHead(404).end();
  });
  await new Promise((r) => fixture.listen(0, "127.0.0.1", r));
  fixtureBase = `http://127.0.0.1:${fixture.address().port}`;
});

after(async () => {
  await browser?.close();
  await sql?.end();
  await new Promise((r) => fixture?.close(r));
});

async function newPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA, acceptDownloads: true, extraHTTPHeaders: { "X-Real-IP": `198.51.100.${++visitor}` }, ...options });
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(`${page.url()}: ${e.message}`));
  page.on("dialog", (d) => d.accept());
  return page;
}

async function admin() {
  const page = await newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/admin`);
  return page;
}

let pluginId;

test("PL-T02: admin builds a draft (category, editor content), drafts are 404 publicly", async () => {
  const page = await admin();
  await page.goto(`${BASE}/admin/plugins/categories/new`);
  await page.fill("input[name=title]", `دسته ${RUN}`);
  await page.fill("input[name=slug]", CAT);
  await page.getByRole("button", { name: "ذخیره دسته" }).click();
  await page.waitForURL(/categories\/\d+\?ok=/);

  await page.goto(`${BASE}/admin/plugins/new`);
  await page.fill("input[name=name]", `افزونه آزمایشی ${RUN}`);
  await page.fill("input[name=slug]", SLUG);
  await page.getByRole("button", { name: "ساخت پیش‌نویس" }).click();
  await page.waitForURL(/plugins\/\d+\?ok=/);
  pluginId = Number(/plugins\/(\d+)/.exec(page.url())[1]);

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await page.keyboard.type("این متن معرفی آزمایشی افزونه است و برای بررسی صفحه عمومی کتابخانه نوشته شده است. ");
  await page.keyboard.press("Enter");
  await page.getByLabel("نوع متن").selectOption("h2");
  await page.keyboard.type("نصب");
  await page.keyboard.press("Enter");
  await page.keyboard.type("افزونه را از پیشخوان وردپرس بارگذاری و فعال کنید؛ این مرحله توضیح کامل نصب است.");
  await page.fill("textarea[name=excerpt]", "خلاصه افزونه آزمایشی");
  await page.fill("input[name=originalName]", "E2E Hello");
  await page.getByLabel(`دسته ${RUN}`).check();
  await page.getByRole("button", { name: "ذخیره پیش‌نویس" }).click();
  await page.locator(".toast").filter({ hasText: "پیش‌نویس ذخیره شد" }).first().waitFor({ timeout: 15000 });

  const draft = await fetch(`${BASE}/plugins/${SLUG}`);
  assert.equal(draft.status, 404, "a draft is a real 404");
  await page.context().close();
});

test("PL-T08/T16: sources refuse private targets; check-now queues one job the worker runs; release waits for review (scanner/sandbox unavailable)", async () => {
  const page = await admin();
  await page.goto(`${BASE}/admin/plugins/${pluginId}/sources`);
  const add = page.locator("form").filter({ hasText: "افزودن منبع" }).last();
  await add.locator("input[name=url]").fill("http://169.254.169.254/latest/meta-data/");
  await add.getByRole("button", { name: "افزودن منبع" }).click();
  await page.waitForURL(/error=/);

  const add2 = page.locator("form").filter({ hasText: "افزودن منبع" }).last();
  await add2.locator("input[name=url]").fill(`${fixtureBase}/plugin`);
  await add2.getByRole("button", { name: /آزمایش منبع/ }).click();
  await add2.getByRole("status").filter({ hasText: "2.4.1" }).waitFor({ timeout: 20000 });
  await add2.getByRole("button", { name: "افزودن منبع" }).click();
  await page.waitForURL(/ok=/);

  await page.getByRole("button", { name: "بررسی همین الان" }).click();
  await page.waitForURL(/ok=/);
  await page.goto(`${BASE}/admin/plugins/${pluginId}/sources`);
  await page.getByRole("button", { name: "بررسی در صف است" }).click(); // a second click joins the same job
  await page.waitForURL(/ok=/);
  const [{ n }] = await sql`select count(*)::int as n from plugin_jobs where plugin_id = ${pluginId} and kind = 'check_plugin'`;
  assert.equal(n, 1, "one logical job");

  let state;
  for (let i = 0; i < 60 && state !== "review"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    [{ state } = {}] = await sql`select state from plugin_releases where plugin_id = ${pluginId}`;
  }
  assert.equal(state, "review", "worker produced a release awaiting review");
  const [rel] = await sql`select checks from plugin_releases where plugin_id = ${pluginId}`;
  assert.equal(rel.checks.validation.status, "PASS");
  assert.equal(rel.checks.scan.status, "UNAVAILABLE");
  assert.equal(rel.checks.checksum.status, "UNAVAILABLE");

  await page.goto(`${BASE}/admin/plugins/${pluginId}/sources`);
  const release = page.locator("li[id^=release-]").first();
  await release.locator("textarea[name=override]").fill("E2E: fixture package reviewed");
  await release.getByRole("button", { name: /انتشار دستی/ }).click();
  await page.waitForURL(/ok=/);
  const [plugin] = await sql`select current_release_id from plugins where id = ${pluginId}`;
  assert.ok(plugin.current_release_id);

  // A global block for all plugins (inserted before the publish, which expires the page cache).
  await sql`insert into plugin_global_blocks (name, title, content, position, enabled, applies_to_all)
    values (${`e2e-${RUN}`}, 'راهنمای عمومی', ${sql.json({ v: 1, doc: { type: "doc", content: [{ type: "heading", attrs: { level: 2, id: "gb1" }, content: [{ type: "text", text: "نصب" }] }, { type: "paragraph", attrs: { id: "gb2" }, content: [{ type: "text", text: `بلوک سراسری ${RUN}` }] }] } })}, 'before_download', true, true)`;
  await page.goto(`${BASE}/admin/plugins/${pluginId}`);
  await page.getByRole("button", { name: "انتشار در سایت" }).click();
  await page.waitForURL(/ok=/);
  await page.context().close();
});

test("PL-T30/T31/T32: public pages, global block, category, sitemap, home, SEO data", async () => {
  const page = await newPage();
  const res = await page.goto(`${BASE}/plugins/${SLUG}`);
  assert.equal(res.status(), 200);
  assert.equal(await page.locator("h1").innerText(), `افزونه آزمایشی ${RUN}`);
  const ld = (await page.locator('script[type="application/ld+json"]').allInnerTexts()).map((t) => JSON.parse(t));
  const app = ld.find((x) => x["@type"] === "SoftwareApplication");
  assert.equal(app.softwareVersion, "2.4.1");
  assert.equal(app.author.name, "Example Author", "author is the original publisher");
  assert.ok(!("aggregateRating" in app) && !("offers" in app), "no invented rating or price");
  assert.ok(!JSON.stringify(ld).includes("/download/"), "no private link in structured data");
  assert.ok(ld.some((x) => x["@type"] === "BreadcrumbList" && x.itemListElement.length === 4));
  assert.equal(await page.locator("link[rel=canonical]").getAttribute("href"), `https://seodaily.ir/plugins/${SLUG}`);
  // The global block renders before the download section, with its own heading anchor (no id clash with the TOC).
  const order = await page.evaluate((run) => {
    const block = [...document.querySelectorAll("section")].find((s) => s.textContent.includes(`بلوک سراسری ${run}`));
    const dl = document.getElementById("download");
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    return { before: Boolean(block && dl && block.compareDocumentPosition(dl) & Node.DOCUMENT_POSITION_FOLLOWING), unique: new Set(ids).size === ids.length };
  }, RUN);
  assert.deepEqual(order, { before: true, unique: true });

  assert.deepEqual(await axe(page), [], "plugin page: WCAG 2.2 AA (axe)");
  const cat = await page.goto(`${BASE}/plugins/${CAT}`);
  assert.deepEqual(await axe(page), [], "category page: WCAG 2.2 AA (axe)");
  assert.equal(cat.status(), 200);
  assert.ok((await page.locator("article").allInnerTexts()).some((t) => t.includes(RUN)));
  await page.goto(`${BASE}/plugins?q=${RUN}`);
  assert.equal(await page.locator("meta[name=robots]").getAttribute("content"), "noindex, follow");
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  assert.ok(sitemap.includes(`/plugins/${SLUG}</loc>`) && sitemap.includes(`/plugins/${CAT}</loc>`));
  await page.goto(`${BASE}/`);
  const cards = page.locator("section").filter({ hasText: "تازه‌ترین" }).locator("article");
  assert.ok((await cards.count()) >= 1 && (await cards.count()) <= 6);
  await page.context().close();
});

test("PL-T22/T23/T24/T26: phone check once per browser, 10-minute link, HEAD/Range not counted, full download counted once", async () => {
  const page = await newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/plugins/${SLUG}`);
  await page.getByRole("button", { name: /دانلود نسخه 2.4.1/ }).click();
  const dialog = page.getByRole("dialog");
  assert.deepEqual(await axe(page), [], "open phone dialog: WCAG 2.2 AA (axe)");
  assert.ok(await page.evaluate(() => document.activeElement?.closest("dialog") !== null), "focus moves into the dialog");
  await dialog.getByLabel("شماره موبایل ایران").fill("09129990000");
  await dialog.getByRole("button", { name: "ارسال کد" }).click();
  await dialog.getByLabel(/کد پیامک‌شده/).waitFor();
  assert.ok(existsSync(SMS_TEST_OUTBOX));
  const code = JSON.parse(readFileSync(SMS_TEST_OUTBOX, "utf8").trim().split("\n").at(-1)).code;
  await dialog.getByLabel(/کد پیامک‌شده/).fill(code);
  await dialog.getByRole("button", { name: "تأیید و ادامه" }).click();
  const link = page.getByRole("link", { name: /دریافت فایل/ });
  await link.waitFor();
  const href = await link.getAttribute("href");
  const cookie = (await page.context().cookies()).find((c) => c.name === "sd_dl");
  assert.ok(cookie.httpOnly && cookie.sameSite === "Lax");

  // From inside the page, so the (Secure, HttpOnly) cookie travels as it does for a real visitor.
  const probe = await page.evaluate(async (url) => {
    const head = await fetch(url, { method: "HEAD" });
    const part = await fetch(url, { headers: { range: "bytes=0-9" } });
    const bytes = (await part.arrayBuffer()).byteLength;
    const suffix = await fetch(url, { headers: { range: "bytes=-1" } });
    return { head: head.status, part: part.status, range: part.headers.get("content-range"), bytes, suffixBytes: (await suffix.arrayBuffer()).byteLength };
  }, href);
  assert.equal(probe.head, 200);
  assert.equal(probe.part, 206);
  assert.equal(probe.bytes, 10);
  assert.equal(probe.suffixBytes, 1);
  assert.match(probe.range, /^bytes 0-9\/\d+$/);
  let [p] = await sql`select measured_download_count as n from plugins where id = ${pluginId}`;
  assert.equal(p.n, 0, "HEAD, a partial prefix and the final byte do not constitute a full download");

  const other = await browser.newContext();
  assert.equal((await other.request.get(`${BASE}${href}`)).status(), 403, "the link needs this browser's session");
  await other.close();

  const wait = page.waitForEvent("download");
  await link.click();
  const file = readFileSync(await (await wait).path());
  const [rel] = await sql`select sha256 from plugin_releases where plugin_id = ${pluginId} and state = 'published'`;
  assert.equal(createHash("sha256").update(file).digest("hex"), rel.sha256, "the untouched, checked package");
  await page.waitForTimeout(500);
  [p] = await sql`select measured_download_count as n from plugins where id = ${pluginId}`;
  assert.equal(p.n, 1);
  await page.context().close();
});

test("PL-T33: plugin page at 320/768/1440 has no horizontal overflow", async () => {
  for (const width of [320, 768, 1440]) {
    const page = await newPage({ viewport: { width, height: 900 } });
    await page.goto(`${BASE}/plugins/${SLUG}`);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `overflow at ${width}`);
    await page.goto(`${BASE}/plugins`);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `overflow /plugins at ${width}`);
    await page.context().close();
  }
  assert.deepEqual(pageErrors, []);
});
