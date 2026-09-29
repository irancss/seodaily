// Destructive journeys ONLY against a disposable database, never production.
import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { chromium } from "playwright-core";
import postgres from "postgres";
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
if (/seodaily\.ir/.test(BASE)) throw new Error("Blog fixtures must never run against production");
const RUN = Date.now().toString(36);
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
let browser, sql;
before(async () => { browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}); sql = postgres(process.env.DATABASE_URL, { max: 3 }); });
after(async () => { await browser?.close(); await sql?.end(); });
async function admin() { const page = await browser.newPage(); await page.goto(`${BASE}/admin/login`); await page.fill("#email", process.env.ADMIN_EMAIL); await page.fill("#password", process.env.ADMIN_PASSWORD); await page.click("button[type=submit]"); await page.waitForURL(/\/admin$/); return page; }
async function until(fn, timeout = 15000) { const end = Date.now() + timeout; while (Date.now() < end) { if (await fn()) return; await new Promise((r) => setTimeout(r, 100)); } throw new Error("condition did not become true"); }
let categoryId, articleId, publishedDraft;
const slug = `blog-e2e-${RUN}`;
test("blog admin: category, autosave, required media, preview isolation, publish snapshot and 301 rename", async () => {
  const page = await admin(), visitor = await browser.newPage();
  await page.goto(`${BASE}/admin/blog/categories`);
  const form = page.locator('form:has(input[name=id][value="0"])');
  await form.locator('[name=title]').fill(`دسته آزمون ${RUN}`); await form.locator('[name=slug]').fill(`category-${RUN}`);
  await form.getByRole("button", { name: "ذخیره دسته" }).click();
  await until(async () => { const [c] = await sql`select id from blog_categories where slug=${`category-${RUN}`}`; categoryId = c?.id; return !!c; });
  await page.goto(`${BASE}/admin/blog`); await page.getByRole("button", { name: "مقاله جدید" }).click(); await page.waitForURL(/\/admin\/blog\/\d+$/); articleId = Number(page.url().split("/").at(-1));
  await page.locator('[name=title]').fill(`مقاله آزمون ${RUN}`); await page.locator('[name=slug]').fill(slug); await page.locator('[name=categoryId]').selectOption(String(categoryId));
  await page.getByRole("textbox", { name: "محتوای مقاله", exact: true }).fill("محتوای واقعی آزمایشی برای بررسی انتشار مقاله و رفتار بلوک‌های متن.");
  await until(async () => (await sql`select draft from blog_articles where id=${articleId}`)[0].draft.slug === slug).catch(async (error) => { throw new Error(`${error.message}: ${await page.getByRole("alert").allTextContents()} / ${await page.getByRole("status").allTextContents()}`); });
  assert.equal((await visitor.request.get(`${BASE}/blog/${slug}`)).status(), 404);
  const denied = await visitor.request.get(`${BASE}/admin/blog/${articleId}/preview`, { maxRedirects: 0 }); assert.ok([302, 303, 307].includes(denied.status())); assert.ok(!(await denied.text()).includes("محتوای واقعی آزمایشی"));
  await page.getByRole("button", { name: "انتشار", exact: true }).click(); await page.getByRole("alert").filter({ hasText: "تصویر شاخص" }).waitFor();
  await page.locator('input[name=image]').locator('..').locator('input[type=file]').setInputFiles({ name: "blog.png", mimeType: "image/png", buffer: PNG });
  await until(async () => !!(await page.locator('input[name=image]').inputValue()));
  await page.locator('[name=imageAlt]').fill("تصویر مقاله آزمایشی");
  await page.getByRole("button", { name: "انتشار", exact: true }).click();
  await until(async () => (await sql`select status from blog_articles where id=${articleId}`)[0].status === "published");
  const [published] = await sql`select * from blog_articles where id=${articleId}`; publishedDraft = published.published;
  await visitor.goto(`${BASE}/blog/${slug}`); assert.equal(await visitor.locator("h1").textContent(), publishedDraft.title);
  assert.equal(await visitor.locator('link[rel=canonical]').getAttribute("href"), `https://seodaily.ir/blog/${slug}`);
  assert.equal(await visitor.locator('meta[property="og:image"]').getAttribute("content"), `https://seodaily.ir${publishedDraft.image}`);
  assert.ok((await visitor.locator('script[type="application/ld+json"]').allTextContents()).some((t) => JSON.parse(t).some?.((x) => x["@type"] === "BlogPosting")));
  assert.equal(await visitor.locator('a[href*="t.me/share"]').count(), 1); assert.equal(await visitor.locator('a[href*="wa.me"]').count(), 1);
  await page.locator('[name=title]').fill(`PRIVATE DRAFT ${RUN}`);
  await until(async () => (await sql`select draft from blog_articles where id=${articleId}`)[0].draft.title.startsWith("PRIVATE"));
  await visitor.reload(); assert.equal(await visitor.locator("h1").textContent(), publishedDraft.title); assert.ok(!(await visitor.content()).includes("PRIVATE DRAFT"));
  const preview = await page.request.get(`${BASE}/admin/blog/${articleId}/preview`); assert.match(preview.headers()["cache-control"], /no-store/); assert.match(preview.headers()["x-robots-tag"], /noindex/); assert.ok((await preview.text()).includes("PRIVATE DRAFT"));
  await page.locator('[name=slug]').fill(`${slug}-new`); await page.getByRole("button", { name: "انتشار", exact: true }).click();
  await until(async () => (await sql`select slug from blog_articles where id=${articleId}`)[0].slug === `${slug}-new`);
  const alias = await visitor.request.get(`${BASE}/blog/${slug}`, { maxRedirects: 0 }); assert.equal(alias.status(), 301); assert.ok(alias.headers().location.endsWith(`${slug}-new`));
  await page.locator('[name=slug]').fill(`${slug}-final`); await page.getByRole("button", { name: "انتشار", exact: true }).click();
  await until(async () => (await sql`select slug from blog_articles where id=${articleId}`)[0].slug === `${slug}-final`);
  const alias2 = await visitor.request.get(`${BASE}/blog/${slug}`, { maxRedirects: 0 }); assert.equal(alias2.status(), 301); assert.ok(alias2.headers().location.endsWith(`${slug}-final`));
  await visitor.close(); await page.close();
});
test("blog public: pagination, normalized search, sitemap, responsive article, no-JS links and real autoplay controls", async () => {
  assert.ok(publishedDraft, "publication journey must succeed first");
  const created = [];
  for (let i = 0; i < 9; i++) {
    const d = { ...publishedDraft, title: `كاربرد يک مقاله ${i}`, slug: `carousel-${RUN}-${i}` };
    const [row] = await sql`insert into blog_articles(slug,status,draft,published,category_id,published_at,content_modified_at,search_text) values (${d.slug},'published',${sql.json(d)},${sql.json(d)},${categoryId},now(),now(),${`کاربرد یک مقاله ${i}`}) returning id`;
    created.push(row.id); await sql`insert into slug_registry(namespace,slug,entity_type,entity_id,kind) values ('blog',${d.slug},'article',${row.id},'current')`;
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" });
  await page.goto(`${BASE}/blog?q=${encodeURIComponent("كاربرد يک")}`); assert.match(await page.locator('meta[name=robots]').getAttribute("content"), /noindex/); assert.ok((await page.locator("h1").textContent()).includes("بلاگ"));
  assert.equal((await page.request.get(`${BASE}/blog?page=999999`)).status(), 404); assert.equal((await page.request.get(`${BASE}/blog?page=oops`)).status(), 404);
  for (const width of [320, 390, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.goto(`${BASE}/blog/${slug}-final`); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px has no overflow`); }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${BASE}/`);
  const section = page.locator('section[aria-labelledby=home-blog-title]'); await section.scrollIntoViewIfNeeded();
  assert.equal(await section.locator("article").count(), 8); assert.equal(await section.locator("[id]").count(), 1);
  await page.mouse.move(0, 0); const track = section.locator(".blog-carousel"); const initial = await track.evaluate((el) => el.scrollLeft);
  await until(async () => Math.abs((await track.evaluate((el) => el.scrollLeft)) - initial) > 20, 10000);
  await section.getByRole("button", { name: "توقف حرکت خودکار" }).click(); await page.mouse.move(0, 0); await page.locator("h1").click();
  await page.waitForTimeout(500); const paused = await track.evaluate((el) => el.scrollLeft); await page.waitForTimeout(6500); assert.equal(await track.evaluate((el) => el.scrollLeft), paused);
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.reload(); await section.scrollIntoViewIfNeeded(); assert.ok(await section.getByRole("button", { name: "ادامه حرکت خودکار" }).count());
  const nojs = await browser.newPage({ javaScriptEnabled: false }); await nojs.goto(`${BASE}/`); assert.equal(await nojs.locator('section[aria-labelledby=home-blog-title] article').count(), 8); assert.equal(await nojs.locator('section[aria-labelledby=home-blog-title] h2 a').count(), 8); await nojs.close();
  const sitemap = await (await page.request.get(`${BASE}/sitemap.xml`)).text(); assert.ok(sitemap.includes(`/blog/${slug}-final`));
  const unauthorized = await page.request.get(`${BASE}/admin/blog`); assert.ok(unauthorized.url().includes("/admin/login"));
  await sql`update blog_articles set status='trash' where id in ${sql(created)}`;
  await page.close();
});

test("blog scheduling is performed by the separate worker, without a public request", async () => {
  const page = await admin();
  await page.goto(`${BASE}/admin/blog`); await page.getByRole("button", { name: "مقاله جدید" }).click(); await page.waitForURL(/\/admin\/blog\/\d+$/);
  const id = Number(page.url().split("/").at(-1));
  // Reuse real uploaded test media; no production credentials/data involved.
  await sql`update blog_articles set draft=${sql.json({ ...publishedDraft, slug: `scheduled-${RUN}` })} where id=${id}`;
  await page.reload();
  const future = new Date(Date.now() + 120000 + 12600_000).toISOString().slice(0, 16);
  await page.locator('[name=schedule]').fill(future); await page.getByRole("button", { name: "زمان‌بندی انتشار", exact: true }).click();
  await until(async () => (await sql`select status from blog_articles where id=${id}`)[0].status === "scheduled");
  assert.equal((await page.request.get(`${BASE}/blog/scheduled-${RUN}`)).status(), 404);
  // Move the disposable job clock forward at the database boundary, then let the real worker claim it.
  await sql`update blog_articles set scheduled_for=now() - interval '1 second' where id=${id}`;
  await until(async () => (await sql`select status from blog_articles where id=${id}`)[0].status === "published", 45000);
  assert.equal((await page.request.get(`${BASE}/blog/scheduled-${RUN}`)).status(), 200);
  const [{ n }] = await sql`select count(*)::int as n from blog_article_revisions where article_id=${id} and kind='publish'`; assert.equal(n, 1);
  await sql`update blog_articles set status='trash' where id=${id}`;
  await page.close();
});
