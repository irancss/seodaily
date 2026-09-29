// PL-T01: plugins and categories share /plugins/{slug}; the database decides races.
//   DATABASE_URL=postgres://…/any npm run test:integration
import assert from "node:assert/strict";
import { test } from "node:test";

import { freshDatabase } from "../support/fresh-db.mjs";

const sql = await freshDatabase("it_slugs");
const { db } = await import("../../src/db/index.ts");
const { claimSlug, resolveSlug, SlugError } = await import("../../src/modules/slugs/registry.ts");

async function newPlugin(name) {
  const [row] = await sql`insert into plugins (slug, name) values (${`tmp-${Math.random()}`}, ${name}) returning id`;
  return row.id;
}
async function newCategory(title) {
  const [row] = await sql`insert into plugin_categories (slug, title) values (${`tmp-${Math.random()}`}, ${title}) returning id`;
  return row.id;
}
const claim = (slug, type, id, keep = false) => db.transaction((tx) => claimSlug(tx, "plugins", slug, type, id, keep));

test("a category slug cannot be taken by a plugin, and route words by nobody", async () => {
  const cat = await newCategory("سئو");
  assert.equal(await claim("SEO", "plugin_category", cat), "seo");
  const plugin = await newPlugin("Yoast");
  await assert.rejects(claim("seo", "plugin", plugin), (e) => e instanceof SlugError && /دسته/.test(e.message));
  await assert.rejects(claim("download", "plugin", plugin), (e) => e instanceof SlugError && /رزرو/.test(e.message));
  assert.deepEqual(await resolveSlug("plugins", "seo"), { kind: "current", entityType: "plugin_category", entityId: cat, slug: "seo" });
  assert.equal(await resolveSlug("plugins", "download"), null, "reserved words resolve to nothing");
});

test("concurrent saves for the same slug: exactly one wins", async () => {
  const cat = await newCategory("امنیت");
  const plugin = await newPlugin("Wordfence");
  const results = await Promise.allSettled([claim("security", "plugin_category", cat), claim("security", "plugin", plugin)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1, JSON.stringify(results.map((r) => r.status)));
  assert.ok(results.find((r) => r.status === "rejected").reason instanceof SlugError, "the loser gets a Persian message, not a 500");
  const [{ n }] = await sql`select count(*)::int as n from slug_registry where namespace = 'plugins' and slug = 'security'`;
  assert.equal(n, 1);
});

test("renaming a public plugin keeps a single-hop 301 alias; the alias cannot be hijacked", async () => {
  const plugin = await newPlugin("Elementor Pro");
  await claim("elementor-pro", "plugin", plugin);
  await claim("elementor-pro-3", "plugin", plugin, true);
  await claim("elementor-pro-4", "plugin", plugin, true);
  assert.deepEqual(await resolveSlug("plugins", "elementor-pro"), { kind: "alias", entityType: "plugin", entityId: plugin, currentSlug: "elementor-pro-4" }, "old slug jumps straight to the newest");
  const other = await newPlugin("Other");
  await assert.rejects(claim("elementor-pro", "plugin", other), SlugError, "an alias still belongs to its plugin");
  // Taking an own alias back makes it current again, without a loop.
  await claim("elementor-pro", "plugin", plugin, true);
  assert.equal((await resolveSlug("plugins", "elementor-pro")).kind, "current");
  assert.deepEqual((await resolveSlug("plugins", "elementor-pro-4")).currentSlug, "elementor-pro");
  const [{ n }] = await sql`select count(*)::int as n from slug_registry where entity_type = 'plugin' and entity_id = ${plugin} and kind = 'current'`;
  assert.equal(n, 1, "one current slug per plugin");
});

test("a draft's old slug is freed instead of aliased", async () => {
  const plugin = await newPlugin("Draft");
  await claim("draft-one", "plugin", plugin);
  await claim("draft-two", "plugin", plugin, false);
  assert.equal(await resolveSlug("plugins", "draft-one"), null);
});

test("the blog namespace is independent", async () => {
  await sql`insert into slug_registry (namespace, slug, entity_type, entity_id, kind) values ('blog', 'seo', 'post', 1, 'current')`;
  assert.equal((await resolveSlug("plugins", "seo")).entityType, "plugin_category");
});
