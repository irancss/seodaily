import assert from "node:assert/strict";
import { test } from "node:test";
import { freshDatabase } from "../support/fresh-db.mjs";

const sql = await freshDatabase("it_drafts");
const { createPlugin, updatePlugin, publishPlugin, CatalogError } = await import("../../src/modules/plugins/catalog.ts");
const { resolveSlug } = await import("../../src/modules/slugs/registry.ts");
const { getPluginAdmin } = await import("../../src/modules/plugins/admin-queries.ts");
const text = "A real description with enough content for publication. ".repeat(4);
const content = { v: 1, doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] } };

test("editorial drafts do not leak names, SEO, categories, media or slug redirects; publication is atomic and revision checked", async () => {
  const [a, b] = await sql`insert into plugin_categories (slug,title) values ('one','One'),('two','Two') returning id`;
  const p = await createPlugin("Original", "original");
  const [release] = await sql`insert into plugin_releases (plugin_id,source_version,sha256,bytes,storage_key,state,downloadable) values (${p.id},'1.0',${"a".repeat(64)},10,'objects/aa/a.zip','published',true) returning id`;
  await sql`update plugins set current_release_id=${release.id} where id=${p.id}`;
  const input = { name: "Original", slug: "original", originalName: "", excerpt: "Original excerpt", content, categoryIds: [a.id], primaryCategoryId: a.id, iconUrl: "/uploads/old.png", gallery: [], meta: {}, seoTitle: "Original SEO", seoDescription: "", seoH1: "", canonicalUrl: "", noindex: false, ogImage: "", autoUpdate: true, allowPrerelease: false, discontinued: false, discontinuedNote: "", relatedIds: [] };
  const saved = await updatePlugin(p.id, 1, input, null);
  await publishPlugin(p.id, null, saved.revision);
  const [{ revision }] = await sql`select revision from plugins where id=${p.id}`;
  const changed = { ...input, name: "Draft name", slug: "draft-address", excerpt: "Draft excerpt", seoTitle: "Draft SEO", noindex: true, categoryIds: [b.id], primaryCategoryId: b.id, iconUrl: "/uploads/new.png" };
  const draft = await updatePlugin(p.id, revision, changed, null);
  const [publicRow] = await sql`select name,slug,excerpt,seo_title,noindex,primary_category_id,icon_url from plugins where id=${p.id}`;
  assert.deepEqual(publicRow, { name: "Original", slug: "original", excerpt: "Original excerpt", seo_title: "Original SEO", noindex: false, primary_category_id: a.id, icon_url: "/uploads/old.png" });
  assert.equal((await resolveSlug("plugins", "original")).kind, "current");
  assert.equal(await resolveSlug("plugins", "draft-address"), null);
  const editor = await getPluginAdmin(p.id);
  assert.equal(editor.plugin.name, "Draft name");
  assert.deepEqual(editor.categoryIds, [b.id]);
  await assert.rejects(publishPlugin(p.id, null, revision), CatalogError);
  await assert.rejects(updatePlugin(p.id, revision, input, null), CatalogError);
  await publishPlugin(p.id, null, draft.revision);
  const [published] = await sql`select name,slug,noindex,draft_data from plugins where id=${p.id}`;
  assert.deepEqual(published, { name: "Draft name", slug: "draft-address", noindex: true, draft_data: null });
  assert.equal((await resolveSlug("plugins", "original")).currentSlug, "draft-address");
  const links = await sql`select category_id from plugin_category_links where plugin_id=${p.id}`;
  assert.deepEqual(links.map((r) => r.category_id), [b.id]);
});
