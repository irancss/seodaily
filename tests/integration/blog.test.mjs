import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { freshDatabase } from "../support/fresh-db.mjs";
const sql = await freshDatabase("it_blog");
const uploads = await mkdtemp(path.join(tmpdir(), "blog-media-")); process.env.UPLOAD_DIR = uploads;
after(() => rm(uploads, { recursive: true, force: true }));
const { createArticle, mutateArticle, publishDueArticles } = await import("../../src/modules/blog/publication.ts");
const { emptyArticle, emptyCategory } = await import("../../src/modules/blog/types.ts");
const { db } = await import("../../src/db/index.ts");
const { claimSlug, resolveSlug } = await import("../../src/modules/slugs/registry.ts");
const { articleById, listArticles, latestArticles, relatedArticles, blogSitemapRows } = await import("../../src/modules/blog/queries.ts");
const { entityHrefs } = await import("../../src/modules/plugins/queries.ts");
const { auditArticleLinks, incomingArticleLinks } = await import("../../src/modules/blog/link-audit.ts");
const file = "blog1234-0123456789abcdef.png";
await writeFile(path.join(uploads, file), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
const [category] = await sql`insert into blog_categories(slug,title,data) values ('seo','SEO',${sql.json(emptyCategory())}) returning *`;
await db.transaction((tx) => claimSlug(tx, "blog", "seo", "blog_category", category.id, false));
const input = (slug) => ({ ...emptyArticle(), title: `عنوان ${slug}`, slug, excerpt: "خلاصه واقعی آزمایشی", categoryId: category.id, image: `/uploads/${file}`, imageAlt: "تصویر آزمون", content: { v: 1, doc: { type: "doc", content: [{ type: "paragraph", attrs: { id: "paragraph01" }, content: [{ type: "text", text: "این متن مقاله برای آزمون انتشار و پیش‌نویس نوشته شده است." }] }] } } });
async function published(slug) { const row = await createArticle(1); return mutateArticle(row.id, row.version, "publish", input(slug), 1); }

test("draft snapshot never changes public body, metadata, dates or alias until transactional publication", async () => {
  let row = await published("snapshot-a"); const firstDate = row.publishedAt.toISOString(), modified = row.contentModifiedAt.toISOString();
  row = await mutateArticle(row.id, row.version, "save", { ...row.draft, title: "PRIVATE TITLE", slug: "snapshot-b", noindex: true }, 1);
  const visible = await articleById(row.id); assert.notEqual(visible.data.title, "PRIVATE TITLE"); assert.equal(visible.slug, "snapshot-a");
  assert.equal(visible.modifiedAt.toISOString(), modified); assert.equal(await resolveSlug("blog", "snapshot-b"), null);
  row = await mutateArticle(row.id, row.version, "publish", row.draft, 1); assert.equal(row.publishedAt.toISOString(), firstDate);
  assert.equal((await resolveSlug("blog", "snapshot-a")).currentSlug, "snapshot-b");
  row = await mutateArticle(row.id, row.version, "publish", { ...row.draft, slug: "snapshot-c" }, 1);
  assert.equal((await resolveSlug("blog", "snapshot-a")).currentSlug, "snapshot-c"); assert.equal((await resolveSlug("blog", "snapshot-b")).currentSlug, "snapshot-c");
  assert.equal((await blogSitemapRows()).some((a) => a.slug === "snapshot-c"), false);
});
test("two tabs and concurrent publication cannot silently overwrite; same-namespace slug races have one winner", async () => {
  const row = await createArticle(1), data = input("race-edit");
  const results = await Promise.allSettled([mutateArticle(row.id, 1, "save", data, 1), mutateArticle(row.id, 1, "save", { ...data, title: "second" }, 1)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const one = await createArticle(1), two = await createArticle(1);
  const slugs = await Promise.allSettled([mutateArticle(one.id, 1, "save", input("same-route"), 1), mutateArticle(two.id, 1, "save", input("same-route"), 1)]);
  assert.equal(slugs.filter((r) => r.status === "fulfilled").length, 1);
  await assert.rejects(mutateArticle(one.id, 1, "publish", input("seo"), 1));
  await db.transaction((tx) => claimSlug(tx, "plugins", "seo", "plugin_category", 10000, false));
  assert.equal((await resolveSlug("plugins", "seo")).entityId, 10000);
});
test("incomplete drafts and invalid media cannot publish or schedule; reserved routes remain reserved", async () => {
  let row = await createArticle(1); row = await mutateArticle(row.id, 1, "save", emptyArticle(), 1);
  await assert.rejects(mutateArticle(row.id, row.version, "publish", row.draft, 1));
  await assert.rejects(mutateArticle(row.id, row.version, "schedule", { ...input("missing"), image: "/uploads/missing1-aaaaaaaaaaaaaaaa.png" }, 1, new Date(Date.now() + 60000)));
  for (const slug of ["search", "preview", "page", "feed", "admin"]) await assert.rejects(mutateArticle(row.id, row.version, "save", input(slug), 1));
});
test("schedule is durable, boundary-correct, single under two workers and audit records actual/planned times", async () => {
  let row = await createArticle(1); const due = new Date(Date.now() + 60000);
  row = await mutateArticle(row.id, 1, "schedule", input("timed"), 1, due);
  assert.equal(await articleById(row.id), null); assert.equal(await publishDueArticles(new Date(due.getTime() - 1)), 0);
  const results = await Promise.all([publishDueArticles(due), publishDueArticles(due)]); assert.equal(results.reduce((a, b) => a + b), 1);
  assert.equal((await articleById(row.id)).publishedAt.toISOString(), due.toISOString());
  const audit = await sql`select planned_at,created_at from blog_article_revisions where article_id=${row.id} and kind='publish'`; assert.equal(audit.length, 1); assert.equal(audit[0].planned_at.toISOString(), due.toISOString());
  assert.equal(await publishDueArticles(new Date(due.getTime() + 10000)), 0);
});
test("cancel, edit, reschedule and archive invalidate old scheduled versions; missed time recovers once", async () => {
  let row = await createArticle(1); const due = new Date(Date.now() + 60000);
  row = await mutateArticle(row.id, 1, "schedule", input("cancelled"), 1, due);
  row = await mutateArticle(row.id, row.version, "save", { ...row.draft, title: "edited" }, 1);
  assert.equal(await publishDueArticles(due), 0); assert.equal(await articleById(row.id), null);
  row = await mutateArticle(row.id, row.version, "schedule", row.draft, 1, due);
  const recovered = new Date(due.getTime() + 600000); assert.equal(await publishDueArticles(recovered), 1);
  assert.equal((await articleById(row.id)).publishedAt.toISOString(), recovered.toISOString());
});
test("archive/trash retain media, history and routes; restore stays private until validated republish", async () => {
  let row = await published("trash-me"); const history = await sql`select count(*)::int as n from blog_article_revisions where article_id=${row.id}`;
  row = await mutateArticle(row.id, row.version, "trash", null, 1); assert.equal(await articleById(row.id), null);
  const hijack = await createArticle(1); await assert.rejects(mutateArticle(hijack.id, 1, "save", input("trash-me"), 1));
  row = await mutateArticle(row.id, row.version, "restore", null, 1); assert.equal(await articleById(row.id), null);
  row = await mutateArticle(row.id, row.version, "publish", row.draft, 1); assert.ok(await articleById(row.id));
  const nextHistory = await sql`select count(*)::int as n from blog_article_revisions where article_id=${row.id}`; assert.ok(nextHistory[0].n > history[0].n);
});
test("featured article outside page one is pinned once; pages stay disjoint and latest eight use first publication", async () => {
  const created = []; for (let i = 0; i < 14; i++) created.push(await published(`paging-${i}`));
  const featured = created[0]; await sql`insert into settings(key,value) values ('blog',${sql.json({ featuredId: featured.id, pageSize: 4 })}) on conflict(key) do update set value=excluded.value`;
  const all = []; const first = await listArticles(); assert.equal(first.featured.id, featured.id);
  for (let page = 1; page <= first.pages; page++) all.push(...(await listArticles({ page })).items.map((a) => a.id));
  assert.equal(new Set(all).size, all.length); assert.equal(all.length, first.total);
  const recent = (await latestArticles()).map((a) => a.id); assert.equal(recent.length, 8);
  await mutateArticle(featured.id, featured.version, "publish", { ...featured.draft, title: "Updated old article" }, 1);
  assert.deepEqual((await latestArticles()).map((a) => a.id), recent);
});
test("entity links follow current slugs, disappear for private targets; related excludes self and noindex", async () => {
  let target = await published("link-target"); const source = await published("link-source");
  const content = { v: 1, doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "target", marks: [{ type: "link", attrs: { href: `entity:article:${target.id}` } }] }] }] } };
  target = await mutateArticle(target.id, target.version, "publish", { ...target.draft, slug: "link-renamed" }, 1);
  assert.equal((await entityHrefs([content]))[`entity:article:${target.id}`], "/blog/link-renamed");
  await mutateArticle(target.id, target.version, "archive", null, 1);
  assert.equal((await entityHrefs([content]))[`entity:article:${target.id}`], null);
  const related = await relatedArticles(await articleById(source.id), 4); assert.ok(related.length <= 4); assert.ok(related.every((a) => a.id !== source.id && a.id !== target.id && !a.data.noindex));
});

test("republishing identical content keeps meaningful dates; scheduling an update preserves the old public snapshot", async () => {
  let row = await published("stable-dates"); const modified = row.contentModifiedAt.toISOString();
  row = await mutateArticle(row.id, row.version, "publish", row.draft, 1);
  assert.equal(row.contentModifiedAt.toISOString(), modified);
  const due = new Date(Date.now() + 60000);
  row = await mutateArticle(row.id, row.version, "schedule", { ...row.draft, title: "scheduled update" }, 1, due);
  assert.notEqual((await articleById(row.id)).data.title, "scheduled update");
  row = await mutateArticle(row.id, row.version, "cancel", null, 1);
  assert.equal(await publishDueArticles(due), 0);
  row = await mutateArticle(row.id, row.version, "schedule", row.draft, 1, due);
  assert.equal(await publishDueArticles(due), 1);
  assert.equal((await articleById(row.id)).data.title, "scheduled update");
});
test("article/category race shares one database namespace; invalid category and missing scheduled media fail closed", async () => {
  const article = await createArticle(1);
  const results = await Promise.allSettled([
    mutateArticle(article.id, 1, "save", input("category-article-race"), 1),
    db.transaction((tx) => claimSlug(tx, "blog", "category-article-race", "blog_category", 99999, false)),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const row = await createArticle(1); await assert.rejects(mutateArticle(row.id, 1, "publish", { ...input("invalid-category"), categoryId: 9999 }, 1));
  const due = new Date(Date.now() + 60000);
  const scheduled = await mutateArticle(row.id, 1, "schedule", input("missing-at-publication"), 1, due);
  await sql`update blog_articles set draft=jsonb_set(draft,'{image}',${JSON.stringify('/uploads/deleted1-aaaaaaaaaaaaaaaa.png')}::jsonb) where id=${scheduled.id}`;
  assert.equal(await publishDueArticles(due), 0);
  const [failure] = await sql`select status,schedule_error,scheduled_for from blog_articles where id=${row.id}`;
  assert.equal(failure.status, "draft"); assert.ok(failure.schedule_error); assert.equal(failure.scheduled_for, null);
});

test("link audit safely reports malformed local URLs and checks end CTA without fetching external hosts", async () => {
  const draft = input("link-audit");
  draft.content.doc.content = [{ type: "paragraph", content: [
    { type: "text", text: "broken", marks: [{ type: "link", attrs: { href: "/blog/%E0%A4%A" } }] },
    { type: "text", text: "external", marks: [{ type: "link", attrs: { href: "https://127.0.0.1/never-fetch" } }] },
  ] }];
  const audit = await auditArticleLinks({ ...draft, endCta: true, ctaHref: "entity:article:999999" });
  assert.equal(audit.length, 3);
  assert.equal(audit[0].resolved, null); assert.ok(audit[0].warning);
  assert.equal(audit[1].resolved, "https://127.0.0.1/never-fetch"); assert.ok(audit[1].warning);
  assert.equal(audit[2].resolved, null); assert.ok(audit[2].warning);
});

test("incoming links include manual alias URLs but exclude private drafts; manual related preserves order", async () => {
  let target = await published("incoming-target");
  const other = await published("related-other");
  const source = await published("incoming-source");
  const data = { ...source.draft, relatedMode: "manual", relatedIds: [target.id, other.id, source.id], content: { v: 1, doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Meaningful linked editorial content for the publication test", marks: [{ type: "link", attrs: { href: "/blog/incoming-target#section" } }] }] }] } } };
  await mutateArticle(source.id, source.version, "publish", data, 1);
  target = await mutateArticle(target.id, target.version, "publish", { ...target.draft, slug: "incoming-renamed" }, 1);
  assert.equal((await incomingArticleLinks(target.id)).length, 1);
  assert.deepEqual((await relatedArticles(await articleById(source.id), 4)).map((a) => a.id), [target.id, other.id]);
  const privateSource = await createArticle(1);
  await mutateArticle(privateSource.id, privateSource.version, "save", { ...data, slug: "private-incoming" }, 1);
  assert.equal((await incomingArticleLinks(target.id)).length, 1);
});
