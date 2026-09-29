// Publication UI regression: disposable local/CI database only. No downloads or worker required.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import postgres from "postgres";
import { chromium } from "playwright-core";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Use a disposable database and test admin credentials.");
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(BASE).hostname)) throw new Error("Publication fixtures must run on loopback, never production.");
const RUN = `publish-ui-${Date.now().toString(36)}`;
let browser, sql, pluginId, categoryId;

async function publicStatus() {
  const response = await fetch(`${BASE}/plugins/${RUN}`);
  await response.arrayBuffer();
  return response.status;
}

before(async () => {
  sql = postgres(DATABASE_URL, { max: 2 });
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  [{ id: categoryId }] = await sql`insert into plugin_categories (slug,title) values (${RUN},${RUN}) returning id`;
});

after(async () => {
  await browser?.close();
  if (sql) {
    if (pluginId) {
      await sql`delete from slug_registry where namespace='plugins' and entity_type='plugin' and entity_id=${pluginId}`;
      await sql`delete from plugins where id=${pluginId}`;
    }
    if (categoryId) await sql`delete from plugin_categories where id=${categoryId}`;
    await sql.end();
  }
});

test("publication stays discoverable, explains blockers and refreshes after saves; saved drafts publish without a reload", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${BASE}/admin/login`);
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/admin`);
  await page.goto(`${BASE}/admin/plugins/new`);
  await page.fill('input[name="name"]', RUN);
  await page.fill('input[name="slug"]', RUN);
  await page.getByRole("button", { name: "ساخت پیش‌نویس" }).click();
  await page.waitForURL(/\/plugins\/\d+\?ok=/);
  pluginId = Number(/plugins\/(\d+)/.exec(page.url())[1]);
  const publish = page.getByRole("button", { name: "انتشار در سایت", exact: true });
  assert.ok(await publish.isVisible(), "incomplete drafts still show the publication button");
  assert.ok(await publish.isDisabled());
  assert.equal(await publish.getAttribute("aria-describedby"), "plugin-publish-blockers");
  await page.getByRole("link", { name: "بررسی وضعیت و انتشار" }).click();
  assert.ok(await page.locator("#plugin-publishing").isVisible());

  await page.locator(".ProseMirror").fill("A complete plugin description with installation and usage information. ".repeat(4));
  await page.fill('textarea[name="excerpt"]', "Publication test excerpt");
  await page.getByLabel(RUN, { exact: true }).check();
  const save = async () => {
    const [{ revision }] = await sql`select revision from plugins where id=${pluginId}`;
    await page.getByRole("button", { name: "ذخیره پیش‌نویس", exact: true }).click();
    // This is the server publication form, not the client's local save revision.
    await page.waitForFunction(previous => {
      const input = document.querySelector('#plugin-publishing input[name="revision"]');
      return input && Number(input.value) > previous;
    }, revision);
  };
  await save();
  assert.ok(await publish.isDisabled(), "content alone cannot bypass package approval");
  assert.equal(await page.locator("#plugin-publish-blockers li").count(), 1);
  assert.equal(await publicStatus(), 404);

  // Even tampering with disabled in the browser cannot publish an unapproved file.
  await publish.evaluate(button => { button.disabled = false; });
  await publish.click();
  await page.waitForURL(/error=/);
  assert.equal((await sql`select status from plugins where id=${pluginId}`)[0].status, "draft");

  // A ready release is a local DB fixture; scanner/sandbox checks are covered by pipeline tests.
  const [{ id: releaseId }] = await sql`insert into plugin_releases (plugin_id,source_version,sha256,bytes,storage_key,state,downloadable)
    values (${pluginId},'1.0',${"a".repeat(64)},10,${`fixtures/${RUN}.zip`},'published',true) returning id`;
  await sql`update plugins set current_release_id=${releaseId} where id=${pluginId}`;
  await page.fill('textarea[name="excerpt"]', "Ready to publish");
  await save();
  assert.ok(await publish.isEnabled(), "saving refreshes blockers without reloading");
  assert.equal(await page.locator('textarea[name="excerpt"]').inputValue(), "Ready to publish");
  await publish.click();
  await page.waitForURL(url => url.searchParams.get("ok") === "افزونه در سایت منتشر شد.");
  const [published] = await sql`select status,slug,revision from plugins where id=${pluginId}`;
  assert.equal(published.status, "published");
  await page.getByRole("button", { name: "انتشار تغییرات پیش‌نویس", exact: true }).waitFor();
  // Observe invalidation from a separate visitor, allowing it to reach the public cache.
  // A failed or missing invalidation still fails this bounded wait.
  let status = await publicStatus();
  const deadline = Date.now() + 15_000;
  while (status === 404 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 200));
    status = await publicStatus();
  }
  assert.equal(status, 200);

  // Repeated save/publish must use the new revision; metadata-only drafts need a warning too.
  await page.fill('input[name="seoTitle"]', "New editorial SEO title");
  await save();
  await page.getByText("پیش‌نویس تغییراتی دارد که هنوز منتشر نشده است.", { exact: true }).waitFor();
  const [draft] = await sql`select seo_title,draft_data from plugins where id=${pluginId}`;
  assert.notEqual(draft.seo_title, "New editorial SEO title");
  assert.equal(draft.draft_data.seoTitle, "New editorial SEO title");
  await page.getByRole("button", { name: "انتشار تغییرات پیش‌نویس", exact: true }).click();
  await page.waitForFunction(() => !document.body.textContent.includes("پیش‌نویس تغییراتی دارد که هنوز منتشر نشده است."));
  assert.equal((await sql`select seo_title from plugins where id=${pluginId}`)[0].seo_title, "New editorial SEO title");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  assert.deepEqual(errors, []);
  await page.close();
});
