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
/** Measurement events in window.dataLayer (see src/lib/analytics.ts), without GTM's own. */
const events = (page) => page.evaluate(() => (window.dataLayer ?? []).filter((e) => !String(e.event).startsWith("gtm.")));
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
  assert.deepEqual(await events(page), [], "a failed submit is no conversion");

  // Invalid phone keeps what was typed.
  await page.fill("#cf-name", "آزمون سفر کاربر");
  await page.fill("#cf-phone", "12ab");
  await page.check("input[value=seo]");
  await page.fill("#cf-desc", `درخواست آزمایشی ${RUN}`);
  await page.click("form[aria-labelledby=cf-title] button[type=submit]");
  await page.waitForFunction(() => /معتبر نیست/.test(document.querySelector("#cf-phone-error")?.textContent ?? ""));
  assert.equal(await page.inputValue("#cf-name"), "آزمون سفر کاربر", "values survive a failed submit");
  assert.equal(await page.inputValue("#cf-desc"), `درخواست آزمایشی ${RUN}`);
  assert.deepEqual(await events(page), [{ event: "form_start", form: "contact" }], "form_start once, however many fields were typed");

  // Valid submit with Persian digits.
  await page.fill("#cf-phone", phone.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]));
  await page.click("form[aria-labelledby=cf-title] button[type=submit]");
  await toast(page, "درخواست مشاوره ثبت شد");
  assert.equal(await leadCount(phone), 1, "saved once, phone normalised to Latin digits");
  assert.deepEqual(await events(page), [
    { event: "form_start", form: "contact" },
    { event: "generate_lead", form: "contact", service: "seo" },
  ]);
  const sent = JSON.stringify(await events(page));
  for (const personal of ["آزمون سفر کاربر", phone, phone.slice(-7), RUN]) assert.ok(!sent.includes(personal), `no personal data in analytics: ${personal}`);

  // The same request sent again (double click / retry) is not stored twice.
  await page.goto(`${BASE}/contact`);
  await page.fill("#cf-name", "آزمون سفر کاربر");
  await page.fill("#cf-phone", phone);
  await page.check("input[value=seo]");
  await page.fill("#cf-desc", `درخواست آزمایشی ${RUN}`);
  await page.click("form[aria-labelledby=cf-title] button[type=submit]");
  await toast(page, "درخواست مشاوره ثبت شد");
  assert.equal(await leadCount(phone), 1, "resubmission is idempotent");
  assert.deepEqual(await events(page), [{ event: "form_start", form: "contact" }], "a retry of a stored lead is not counted again");
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
  assert.deepEqual(await events(page), [{ event: "form_start", form: "estimate" }]);

  // Default configuration: site type and design are the required choices.
  await panel.getByRole("radio", { name: /فروشگاه اینترنتی/ }).check();
  await panel.getByRole("radio", { name: /طراحی اختصاصی/ }).check();
  await panel.getByRole("button", { name: "ثبت درخواست برآورد" }).click();
  await panel.getByText("درخواست شما ثبت شد").waitFor({ timeout: 15_000 });
  const [lead] = await sql`select service, estimate from leads where phone = ${phone}`;
  assert.equal(lead.service, "web-design");
  assert.equal(lead.estimate.source, "calculator");
  assert.equal(lead.estimate.total, lead.estimate.items.reduce((s, i) => s + i.amount, 0), "total is the sum of the stored items");
  assert.deepEqual(await events(page), [
    { event: "form_start", form: "estimate" },
    { event: "pricing_start", service: "web-design" },
    { event: "generate_lead", form: "estimate", service: "web-design", estimate_total_toman: lead.estimate.total },
  ]);

  // Leaving and coming back (client navigation, then Back) does not count the lead again.
  await page.locator('header a[href="/contact"]').first().click();
  await page.waitForURL(/\/contact$/);
  await page.goBack();
  await page.waitForURL(/\/pricing$/);
  await panel.getByRole("button", { name: "ثبت درخواست برآورد" }).waitFor();
  assert.equal((await events(page)).filter((e) => e.event === "generate_lead").length, 1, "one conversion after Back");
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

test("admin: independent header and footer logos survive other settings, reject invalid files and restore defaults", async () => {
  const page = await adminPage();
  const visitor = await newPage();
  const general = async () => (await sql`select value from settings where key = 'general'`)[0].value;
  const submit = async (key) => {
    await page.locator(`form:has(input[name=${key}]) button[type=submit]`).click();
    await page.waitForURL(/[?&](ok|error)=/);
  };
  const upload = async (key, buffer = PNG) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.setInputFiles(`input[name=${key}]`, { name: "logo.png", mimeType: "image/png", buffer });
    await submit(key);
  };
  const imageUrl = async (selector) => new URL(await visitor.locator(selector).getAttribute("src"), BASE).searchParams.get("url");
  try {
    await upload("headerLogo");
    assert.match(page.url(), /ok=/);
    const header = (await general()).headerLogo;
    await upload("footerLogo");
    const footer = (await general()).footerLogo;
    assert.notEqual(header, footer, "logos have independent files");
    await visitor.goto(`${BASE}/about`);
    assert.equal(await imageUrl('header > div > a[href="/"] img'), header);
    assert.equal(await imageUrl('footer a[href="/"] img'), footer);
    await visitor.locator('header > div > a[href="/"] img').evaluate((img) => img.decode());
    await visitor.locator('footer a[href="/"] img').scrollIntoViewIfNeeded();
    await visitor.locator('footer a[href="/"] img').evaluate((img) => img.decode());
    assert.equal(await visitor.locator('header > div > a[href="/"] img').getAttribute("alt"), (await general()).siteName);
    for (const width of [360, 768]) {
      await visitor.setViewportSize({ width, height: 800 });
      await visitor.getByRole("button", { name: "باز کردن منو", exact: true }).click();
      assert.equal(await imageUrl('dialog a[href="/"] img'), header);
      await visitor.getByRole("button", { name: "بستن منو", exact: true }).click();
      assert.ok(await visitor.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: no horizontal overflow`);
    }
    // An unrelated settings save must retain both logos.
    await page.goto(`${BASE}/admin/settings`);
    await submit("siteName");
    assert.equal((await general()).headerLogo, header);
    assert.equal((await general()).footerLogo, footer);
    // MIME and extension alone cannot turn an SVG/script into an accepted logo.
    await upload("headerLogo", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
    assert.match(page.url(), /error=/);
    assert.equal((await general()).headerLogo, header);
    assert.equal((await page.request.get(BASE + header)).status(), 200);
    await upload("headerLogo");
    assert.notEqual((await general()).headerLogo, header);
    assert.equal((await page.request.get(BASE + header)).status(), 404, "replaced file is removed");
    assert.equal((await general()).footerLogo, footer);
    for (const key of ["headerLogo", "footerLogo"]) {
      const old = (await general())[key];
      await page.goto(`${BASE}/admin/settings`);
      await page.check(`input[name=${key}_remove]`);
      await submit(key);
      assert.equal((await general())[key], "");
      assert.equal((await page.request.get(BASE + old)).status(), 404);
      await visitor.goto(`${BASE}/about`);
      const region = key === "headerLogo" ? "header > div" : "footer";
      assert.equal(await visitor.locator(`${region} a[href="/"] img`).count(), 0);
      assert.equal(await visitor.locator(`${region} a[href="/"]`).first().textContent(), (await general()).siteName);
      if (key === "headerLogo") assert.equal(await imageUrl('footer a[href="/"] img'), footer);
    }
  } finally {
    await visitor.context().close();
    await page.context().close();
  }
});

test("admin: a GTM container loads once on public pages, never in the panel, and only in its exact format", async () => {
  const page = await adminPage();
  const save = async (value) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.fill("input[name=gtmId]", value);
    await page.locator("form:has(input[name=gtmId]) button[type=submit]").click();
    await page.waitForURL(/(ok|error)=/);
  };
  const gtmScripts = (p) => p.evaluate(() => [...document.scripts].filter((s) => s.id === "gtm" || /googletagmanager/.test(s.src)).map((s) => s.id || s.src));

  await save("UA-12345-1");
  assert.match(decodeURIComponent(page.url()), /GTM-XXXXXXX/, "a GA3 ID is refused");
  await save("  gtm-ab12cd3 ");
  assert.match(page.url(), /ok=/);
  assert.equal(await page.inputValue("input[name=gtmId]"), "GTM-AB12CD3", "stored normalised");
  assert.deepEqual(await gtmScripts(page), [], "no tag in the admin panel");

  const visitor = await newPage();
  await visitor.goto(`${BASE}/services`);
  await visitor.waitForFunction(() => document.getElementById("gtm"));
  assert.equal((await gtmScripts(visitor)).filter((s) => s === "gtm").length, 1, "one loader");
  assert.equal(await visitor.evaluate(() => window.dataLayer.filter((e) => e.event === "gtm.js").length), 1, "GTM started once");
  // Client navigation must not add a second copy.
  await visitor.locator('header a[href="/contact"]').first().click();
  await visitor.waitForURL(/\/contact$/);
  assert.equal(await visitor.evaluate(() => window.dataLayer.filter((e) => e.event === "gtm.js").length), 1, "still once after navigation");

  await save("");
  assert.match(page.url(), /ok=/);
  await visitor.goto(`${BASE}/services`);
  assert.deepEqual(await gtmScripts(visitor), [], "cleared ID removes the tag");
  await visitor.context().close();
  await page.context().close();
});

test("admin: a published project with an image reaches the portfolio, its page and the sitemap, then is removed", async () => {
  const page = await adminPage();
  const slug = `e2e-project-${RUN}`;
  const title = `پروژه آزمایشی ${RUN}`;
  const sitemap = async () => (await page.request.get(`${BASE}/sitemap.xml`)).text();
  const portfolioIndexed = async () => !/<meta name="robots" content="noindex/.test(await (await page.request.get(`${BASE}/portfolio`)).text());
  const hadProjects = (await sql`select count(*)::int as n from projects where published`)[0].n > 0;

  await page.goto(`${BASE}/admin/projects/new`);
  await page.fill("input[name=title]", title);
  await page.fill("input[name=slug]", slug);
  await page.fill("[name=summary]", "خلاصه پروژه آزمایشی برای بررسی نمایش در سایت.");
  await page.setInputFiles("input[name=image]", { name: "p.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: "ایجاد پروژه" }).click();
  await page.waitForURL(/\/admin\/projects\/\d+\?ok=/);
  const [created] = await sql`select id, image_url from projects where slug = ${slug}`;
  assert.ok(created.image_url.startsWith("/uploads/"), "image stored");

  const visitor = await newPage();
  await visitor.goto(`${BASE}/portfolio`);
  await visitor.getByText(title).first().waitFor();
  const detail = await visitor.request.get(`${BASE}/portfolio/${slug}`);
  assert.equal(detail.status(), 200, "project page is live");
  assert.ok((await sitemap()).includes(`/portfolio/${slug}`), "project in the sitemap");
  assert.ok(await portfolioIndexed(), "portfolio is indexable once it has a project");

  await page.goto(`${BASE}/admin/projects/${created.id}`);
  await page.getByRole("button", { name: "حذف پروژه" }).click();
  await page.waitForURL(/\/admin\/projects(\?|$)/);
  assert.equal((await visitor.request.get(`${BASE}/portfolio/${slug}`)).status(), 404, "deleted project is gone");
  assert.equal((await visitor.request.get(BASE + created.image_url)).status(), 404, "its image is removed");
  assert.ok(!(await sitemap()).includes(`/portfolio/${slug}`), "and out of the sitemap");
  assert.equal(await portfolioIndexed(), hadProjects, "portfolio indexing back to its previous state");
  await visitor.context().close();
  await page.context().close();
});

test("admin: page texts and title reach the public page, then are restored", async () => {
  const page = await adminPage();
  const form = page.locator("form:has(input[name=page][value=about])");
  await page.goto(`${BASE}/admin/pages`);
  await page.locator("#about > summary").click();
  const original = { title: await form.locator("[name=title]").inputValue(), metaTitle: await form.locator("[name=metaTitle]").inputValue() };
  const save = async (title, metaTitle) => {
    await page.goto(`${BASE}/admin/pages`);
    if (!(await form.locator("[name=title]").isVisible())) await page.locator("#about > summary").click();
    await form.locator("[name=title]").fill(title);
    await form.locator("[name=metaTitle]").fill(metaTitle);
    await form.getByRole("button", { name: "ذخیره" }).click();
    await page.waitForURL(/ok=/);
  };
  await save(`درباره آزمایشی ${RUN}`, `عنوان سئو آزمایشی ${RUN}`);
  const html = await (await page.request.get(`${BASE}/about`)).text();
  assert.match(html, new RegExp(`<h1[^>]*>[^<]*درباره آزمایشی ${RUN}`), "H1 from the panel");
  assert.match(html, new RegExp(`<title>عنوان سئو آزمایشی ${RUN}`), "title from the panel");
  await save(original.title, original.metaTitle);
  assert.doesNotMatch(await (await page.request.get(`${BASE}/about`)).text(), new RegExp(RUN), "restored");
  await page.context().close();
});

test("admin: a team member with a photo appears on the about page, then is removed", async () => {
  const page = await adminPage();
  const name = `عضو آزمایشی ${RUN}`;
  await page.goto(`${BASE}/admin/team`);
  const form = page.locator("form:has(button:text-is('افزودن'))");
  await form.locator("[name=name]").fill(name);
  await form.locator("[name=role]").fill("نقش آزمایشی");
  await form.locator("input[name=photo]").setInputFiles({ name: "t.png", mimeType: "image/png", buffer: PNG });
  await form.getByRole("button", { name: "افزودن" }).click();
  await page.waitForURL(/ok=/);
  const [member] = await sql`select id, photo_url from team_members where name = ${name}`;
  assert.ok(member.photo_url.startsWith("/uploads/"));
  const about = await (await page.request.get(`${BASE}/about`)).text();
  assert.ok(about.includes(name), "member on the about page");
  assert.ok(about.includes(`alt="${name}"`), "photo with the member's name as alt text");

  await page.goto(`${BASE}/admin/team`);
  await page.locator(`form:has(input[name=id][value="${member.id}"])`).getByRole("button", { name: "حذف" }).click();
  await page.waitForURL(/ok=/);
  assert.ok(!(await (await page.request.get(`${BASE}/about`)).text()).includes(name), "removed from the about page");
  assert.equal((await page.request.get(BASE + member.photo_url)).status(), 404, "photo removed");
  await page.context().close();
});

test("admin: a menu item reaches the site header, and the default menu comes back", async () => {
  const page = await adminPage();
  const label = `منوی آزمایشی ${RUN}`.slice(0, 40);
  await page.goto(`${BASE}/admin/menus`);
  await page.getByRole("button", { name: "افزودن آیتم" }).first().click();
  const item = page.locator("#menu-panel > ol > li").last();
  await item.locator("input").first().fill(label);
  await item.locator("input[dir=ltr]").fill("/about");
  await page.getByRole("button", { name: "ذخیره منوها" }).click();
  await page.waitForURL(/ok=/);
  const visitor = await newPage();
  await visitor.goto(`${BASE}/services`);
  await visitor.locator("header nav").getByRole("link", { name: label }).waitFor({ state: "attached" });

  await page.goto(`${BASE}/admin/menus`);
  await page.getByRole("button", { name: "بازگشت به منوی پیش‌فرض" }).click();
  await page.waitForURL(/ok=/);
  await visitor.reload();
  assert.equal(await visitor.locator("header nav").getByRole("link", { name: label }).count(), 0, "default menu restored");
  await visitor.context().close();
  await page.context().close();
});

test("admin: a price set in the pricing editor reaches the public calculator, and the default comes back", async () => {
  const page = await adminPage();
  await page.goto(`${BASE}/admin/pricing`, { waitUntil: "networkidle" });
  const labels = page.getByLabel("عنوان گزینه");
  let row = -1;
  for (let i = 0; i < (await labels.count()); i++) if ((await labels.nth(i).inputValue()) === "سایت شرکتی") row = i;
  assert.ok(row >= 0, "the «سایت شرکتی» option is in the editor");
  await page.getByLabel("قیمت (تومان)").nth(row).fill("27500000");
  await page.getByRole("button", { name: /^ذخیره تعرفه/ }).click();
  await toast(page, "تعرفه‌ها ذخیره شد.");
  const pricing = await (await page.request.get(`${BASE}/pricing`)).text();
  assert.ok(pricing.includes("۲۷٬۵۰۰٬۰۰۰"), "new price on the public calculator");

  await page.getByRole("button", { name: "بازگشت به ساختار پیش‌فرض" }).first().click();
  await toast(page, "ساختار پیش‌فرض");
  assert.ok(!(await (await page.request.get(`${BASE}/pricing`)).text()).includes("۲۷٬۵۰۰٬۰۰۰"), "default prices back");
  await page.context().close();
});

test("admin: the contract for a stored lead renders with its details", async () => {
  const page = await adminPage();
  const [lead] = await sql`insert into leads (name, phone, service, business) values (${`مشتری قرارداد ${RUN}`}, '09350000000', 'seo', 'کسب‌وکار آزمایشی') returning id`;
  const res = await page.goto(`${BASE}/admin/leads/${lead.id}/contract`);
  assert.equal(res.status(), 200);
  await page.getByText(`مشتری قرارداد ${RUN}`).first().waitFor();
  await sql`delete from leads where id = ${lead.id}`;
  await page.context().close();
});

test("stored XSS: markup sent through the public form and the panel is shown as text, never run", async () => {
  const payload = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
  const phone = `0901${String(Date.now()).slice(-7)}`;

  // Public form → admin lead list, detail and contract.
  const visitor = await newPage();
  await visitor.goto(`${BASE}/contact`);
  await visitor.fill("#cf-name", `مهاجم ${payload}`.slice(0, 120));
  await visitor.fill("#cf-phone", phone);
  await visitor.check("input[value=seo]");
  await visitor.fill("#cf-desc", `</textarea>${payload}`);
  await visitor.click("form[aria-labelledby=cf-title] button[type=submit]");
  await toast(visitor, "درخواست مشاوره ثبت شد");
  const [lead] = await sql`select id from leads where phone = ${phone}`;
  const page = await adminPage();
  for (const path of ["/admin/leads", `/admin/leads/${lead.id}`, `/admin/leads/${lead.id}/contract`]) {
    await page.goto(BASE + path);
    await page.getByText("مهاجم", { exact: false }).first().waitFor();
    assert.equal(await page.evaluate(() => window.__xss), undefined, `${path}: payload did not run`);
    assert.equal(await page.locator("img[src=x], script:text('window.__xss')").count(), 0, `${path}: no element made from the payload`);
  }

  // Panel → public service page (and its JSON-LD).
  const slug = `xss-${RUN}`;
  await page.goto(`${BASE}/admin/services/new`);
  await page.fill("input[name=title]", `خدمت ${payload}`.slice(0, 200));
  await page.fill("input[name=slug]", slug);
  await page.getByRole("button", { name: "ایجاد خدمت" }).click();
  await page.waitForURL(/\/admin\/services\/\d+\?ok=/);
  await visitor.goto(`${BASE}/services/${slug}`);
  assert.equal(await visitor.evaluate(() => window.__xss), undefined, "public page: payload did not run");
  assert.ok((await visitor.locator("h1").textContent()).includes("<script>"), "shown as text in the H1");
  const html = await visitor.content();
  for (const block of html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) ?? []) {
    assert.ok(!/<script>window/.test(block.slice(1)), "JSON-LD cannot close its script tag");
  }

  await page.goto(`${BASE}/admin/services`);
  const [service] = await sql`select id from services where slug = ${slug}`;
  await page.goto(`${BASE}/admin/services/${service.id}`);
  await page.getByRole("button", { name: "حذف خدمت" }).click();
  await page.waitForURL(/\/admin\/services\?ok=/);
  await sql`delete from leads where id = ${lead.id}`;
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
