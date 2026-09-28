// End-to-end journeys in a real browser against a running server and its database:
//   BASE_URL=http://127.0.0.1:3000 DATABASE_URL=postgres://… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run test:e2e
// Writes data: run it only against a disposable database (CI, local), never Production.
// CHROMIUM_PATH may point at a local Chromium; otherwise Playwright's own is used.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import postgres from "postgres";
import { chromium } from "playwright-core";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const { ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !DATABASE_URL) throw new Error("Set ADMIN_EMAIL, ADMIN_PASSWORD and DATABASE_URL (disposable database).");
if (/seodaily\.ir/.test(BASE)) throw new Error("The E2E journeys write data; do not run them against Production.");

// A valid 1×1 PNG, so uploads need no fixture file.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const RUN = Date.now().toString(36);

let browser;
let sql;
const pageErrors = [];

before(async () => {
  sql = postgres(DATABASE_URL, { max: 2 });
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});

after(async () => {
  await browser?.close();
  await sql?.end();
});

let visitor = 0;
async function newPage(viewport = { width: 1280, height: 900 }, options = {}) {
  // Each browser is its own visitor for the per-address rate limits (as nginx would report it).
  const context = await browser.newContext({ viewport, extraHTTPHeaders: { "X-Real-IP": `203.0.113.${++visitor}-${RUN}` }, ...options });
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(`${page.url()}: ${e.message}`));
  page.on("dialog", (d) => d.accept());
  return page;
}

async function adminPage() {
  const page = await newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/admin$/);
  return page;
}

const toast = (page, text) => page.locator(".toast").filter({ hasText: text }).first().waitFor({ timeout: 15_000 });
const leadCount = async (phone) => (await sql`select count(*)::int as n from leads where phone = ${phone}`)[0].n;

test("navigation works on phone, tablet and desktop widths", async () => {
  for (const width of [360, 390, 768, 1280]) {
    const page = await newPage({ width, height: 800 }, width < 1024 ? { isMobile: true, hasTouch: true } : {});
    await page.goto(`${BASE}/`);
    if (width < 1024) {
      const toggle = page.getByRole("button", { name: /منو/ }).first();
      await toggle.click();
      const drawer = page.getByRole("dialog");
      await drawer.waitFor();
      await drawer.getByRole("link", { name: "تماس" }).first().click();
    } else {
      await page.locator("header").getByRole("link", { name: "تماس" }).first().click();
    }
    await page.waitForURL(/\/contact$/);
    assert.equal(await page.locator("h1").count(), 1, `${width}px: contact page reached`);
    await page.goBack();
    await page.waitForURL(`${BASE}/`);
    await page.context().close();
  }
});

test("contact form: validation, success, persistence and no duplicate on resubmit", async () => {
  const page = await newPage({ width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  const phone = `0912${String(Date.now()).slice(-7)}`;
  await page.goto(`${BASE}/contact`);

  // Empty submit: field errors, nothing saved.
  await page.click("form[aria-labelledby=cf-title] button[type=submit]");
  await page.locator("#cf-name-error").waitFor();
  assert.match(await page.textContent("#cf-phone-error"), /شماره تماس/);

  // Invalid phone keeps what was typed.
  await page.fill("#cf-name", "آزمون سفر کاربر");
  await page.fill("#cf-phone", "12ab");
  await page.check("input[value=seo]");
  await page.fill("#cf-desc", `درخواست آزمایشی ${RUN}`);
  await page.click("form[aria-labelledby=cf-title] button[type=submit]");
  await page.waitForFunction(() => /معتبر نیست/.test(document.querySelector("#cf-phone-error")?.textContent ?? ""));
  assert.equal(await page.inputValue("#cf-name"), "آزمون سفر کاربر", "values survive a failed submit");
  assert.equal(await page.inputValue("#cf-desc"), `درخواست آزمایشی ${RUN}`);

  // Valid submit with Persian digits.
  await page.fill("#cf-phone", phone.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]));
  await page.click("form[aria-labelledby=cf-title] button[type=submit]");
  await toast(page, "درخواست مشاوره ثبت شد");
  assert.equal(await leadCount(phone), 1, "saved once, phone normalised to Latin digits");

  // The same request sent again (double click / retry) is not stored twice.
  await page.goto(`${BASE}/contact`);
  await page.fill("#cf-name", "آزمون سفر کاربر");
  await page.fill("#cf-phone", phone);
  await page.check("input[value=seo]");
  await page.fill("#cf-desc", `درخواست آزمایشی ${RUN}`);
  await page.click("form[aria-labelledby=cf-title] button[type=submit]");
  await toast(page, "درخواست مشاوره ثبت شد");
  assert.equal(await leadCount(phone), 1, "resubmission is idempotent");
  await page.context().close();
});

test("pricing calculator: required choice, server-computed total, stored estimate", async () => {
  const page = await newPage();
  const phone = `0935${String(Date.now()).slice(-7)}`;
  await page.goto(`${BASE}/pricing`);
  const panel = page.locator("#panel-web-design");
  await panel.getByRole("button", { name: "ثبت درخواست برآورد" }).waitFor();

  // Submitting without the required choice shows the group error and saves nothing.
  await panel.getByLabel("نام و نام خانوادگی").fill("آزمون تعرفه");
  await panel.getByLabel("شماره تماس").fill(phone);
  await panel.getByRole("button", { name: "ثبت درخواست برآورد" }).click();
  await panel.getByText("«نوع سایت» را انتخاب کنید.").waitFor();
  assert.equal(await leadCount(phone), 0);

  // Default configuration: site type and design are the required choices.
  await panel.getByRole("radio", { name: /فروشگاه اینترنتی/ }).check();
  await panel.getByRole("radio", { name: /طراحی اختصاصی/ }).check();
  await panel.getByRole("button", { name: "ثبت درخواست برآورد" }).click();
  await panel.getByText("درخواست شما ثبت شد").waitFor({ timeout: 15_000 });
  const [lead] = await sql`select service, estimate from leads where phone = ${phone}`;
  assert.equal(lead.service, "web-design");
  assert.equal(lead.estimate.source, "calculator");
  assert.equal(lead.estimate.total, lead.estimate.items.reduce((s, i) => s + i.amount, 0), "total is the sum of the stored items");
  await page.context().close();
});

test("admin: service create, duplicate slug keeps the stored image, public page, delete", async () => {
  const page = await adminPage();
  const slug = `e2e-${RUN}`;
  const [{ slug: taken }] = await sql`select slug from services order by id limit 1`;

  await page.goto(`${BASE}/admin/services/new`);
  await page.fill("input[name=title]", `خدمت آزمایشی ${RUN}`);
  await page.fill("input[name=slug]", slug);
  await page.setInputFiles("input[name=image]", { name: "a.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: "ایجاد خدمت" }).click();
  await page.waitForURL(/\/admin\/services\/\d+\?ok=/);
  const [created] = await sql`select id, image_url from services where slug = ${slug}`;
  assert.ok(created.image_url.startsWith("/uploads/"));
  assert.equal((await page.request.get(BASE + created.image_url)).status(), 200);
  const servicePage = await page.request.get(`${BASE}/services/${slug}`);
  assert.equal(servicePage.status(), 200, "published page is live");
  // The page asks for a resized copy (next/image), never the original upload.
  const html = await servicePage.text();
  const optimized = html.match(/\/_next\/image\?url=%2Fuploads%2F[^"&]+&amp;w=\d+&amp;q=\d+/)?.[0];
  assert.ok(optimized, "service image goes through the image optimizer");
  assert.ok(!html.includes(`src="${created.image_url}"`), "original file is not embedded");
  const resized = await page.request.get(BASE + optimized.replace(/&amp;/g, "&"), { headers: { Accept: "image/webp,*/*" } });
  assert.equal(resized.status(), 200);
  assert.equal(resized.headers()["content-type"], "image/webp");

  // A failing save (slug already used) must not delete the image the record still points to.
  await page.setInputFiles("input[name=image]", { name: "b.png", mimeType: "image/png", buffer: PNG });
  await page.fill("input[name=slug]", taken);
  await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
  await page.waitForURL(/error=/);
  await toast(page, "نامک");
  const [unchanged] = await sql`select slug, image_url from services where id = ${created.id}`;
  assert.deepEqual(unchanged, { slug, image_url: created.image_url });
  assert.equal((await page.request.get(BASE + created.image_url)).status(), 200, "stored image still served");

  await page.goto(`${BASE}/admin/services/${created.id}`);
  await page.getByRole("button", { name: "حذف خدمت" }).click();
  await page.waitForURL(/\/admin\/services\?ok=/);
  assert.equal((await page.request.get(`${BASE}/services/${slug}`)).status(), 404, "deleted page is gone");
  assert.equal((await page.request.get(BASE + created.image_url)).status(), 404, "its image is removed");
  await page.context().close();
});

test("admin: FAQ appears on the public page; editing a deleted FAQ is reported", async () => {
  const page = await adminPage();
  const question = `پرسش آزمایشی ${RUN}؟`;
  await page.goto(`${BASE}/admin/faqs?page=home`);
  const addForm = page.locator("form").filter({ has: page.getByRole("button", { name: "افزودن سؤال" }) });
  await addForm.locator("[name=question]").fill(question);
  await addForm.locator("[name=answer]").fill("پاسخ آزمایشی.");
  await addForm.getByRole("button", { name: "افزودن سؤال" }).click();
  await page.waitForURL(/ok=/);
  const publicPage = await newPage();
  await publicPage.goto(`${BASE}/`);
  assert.ok(await publicPage.getByText(question).count(), "shown on the home page");

  // Delete it behind the editor's back, then save the open form.
  const [faq] = await sql`select id from faqs where question = ${question}`;
  await page.goto(`${BASE}/admin/faqs?page=home`);
  const editForm = page.locator("form").filter({ has: page.locator(`input[name=id][value="${faq.id}"]`) }).first();
  await sql`delete from faqs where id = ${faq.id}`;
  await editForm.getByRole("button", { name: "ذخیره" }).click();
  await page.waitForURL(/error=/);
  await toast(page, "دیگر وجود ندارد");
  await publicPage.context().close();
  await page.context().close();
});

test("admin: lead status persists after reload", async () => {
  const [lead] = await sql`insert into leads (name, phone, service) values (${`پیگیری ${RUN}`}, '09120000001', 'seo') returning id`;
  const page = await adminPage();
  await page.goto(`${BASE}/admin/leads/${lead.id}`);
  await page.selectOption("select[name=status]", "in_progress");
  await page.fill("textarea[name=adminNote]", "تماس گرفته شد");
  await page.locator("form:has(select[name=status])").getByRole("button").click();
  await page.waitForURL(/ok=/);
  await page.reload();
  assert.equal(await page.inputValue("select[name=status]"), "in_progress");
  assert.equal(await page.inputValue("textarea[name=adminNote]"), "تماس گرفته شد");
  await page.context().close();
});

test("admin: contact phone change reaches the public footer, then is restored", async () => {
  const page = await adminPage();
  await page.goto(`${BASE}/admin/settings`);
  const original = await page.inputValue("input[name=phone]");
  const save = (value) =>
    page.fill("input[name=phone]", value).then(() => page.locator("form:has(input[name=phone]) button[type=submit]").click());
  await save("021 8888 7777");
  await page.waitForURL(/ok=/);
  const visitor = await newPage();
  await visitor.goto(`${BASE}/about`);
  assert.equal(await visitor.locator("footer a[href='tel:+982188887777']").count(), 1);
  await page.goto(`${BASE}/admin/settings`);
  await save(original);
  await page.waitForURL(/ok=/);
  await visitor.context().close();
  await page.context().close();
});

test("admin: login returns to the requested page, never to another site", async () => {
  const [lead] = await sql`insert into leads (name, phone, service) values (${`بازگشت ${RUN}`}, '09120000002', 'seo') returning id`;
  const page = await newPage();
  await page.goto(`${BASE}/admin/leads/${lead.id}`);
  await page.waitForURL(/\/admin\/login\?next=/);
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/admin/leads/${lead.id}`);
  await page.context().close();

  const other = await newPage();
  await other.goto(`${BASE}/admin/login?next=${encodeURIComponent("https://evil.example/admin")}`);
  await other.fill("#email", ADMIN_EMAIL);
  await other.fill("#password", ADMIN_PASSWORD);
  await other.click("button[type=submit]");
  await other.waitForURL(`${BASE}/admin`);
  await other.context().close();
});

test("admin: leaving a form with unsaved edits asks first", async () => {
  const page = await adminPage();
  const dialogs = [];
  page.removeAllListeners("dialog");
  let answer = false;
  page.on("dialog", (d) => {
    dialogs.push(d.message());
    return answer ? d.accept() : d.dismiss();
  });
  await page.goto(`${BASE}/admin/settings`);
  const footerNote = page.locator("input[name=footerNote]");
  await footerNote.fill(`${await footerNote.inputValue()} `);
  await page.locator("aside").getByRole("link", { name: /درخواست/ }).first().click();
  await page.waitForTimeout(500);
  assert.match(dialogs[0] ?? "", /ذخیره‌نشده/);
  assert.match(page.url(), /\/admin\/settings$/, "stays when the admin cancels");
  answer = true;
  await page.locator("aside").getByRole("link", { name: /درخواست/ }).first().click();
  await page.waitForURL(/\/admin\/leads/);
  // Nothing typed: no question.
  await page.locator("aside").getByRole("link", { name: /داشبورد/ }).first().click();
  await page.waitForURL(`${BASE}/admin`);
  assert.equal(dialogs.length, 2);
  await page.context().close();
});

test("logout ends the session", async () => {
  const page = await adminPage();
  await page.locator("aside").getByRole("button", { name: "خروج" }).click();
  await page.waitForURL(/\/admin\/login$/);
  await page.goto(`${BASE}/admin/leads`);
  assert.match(page.url(), /\/admin\/login\?next=%2Fadmin%2Fleads$/);
  await page.context().close();
});

test("no uncaught page errors during the journeys", () => {
  assert.deepEqual(pageErrors, []);
});
