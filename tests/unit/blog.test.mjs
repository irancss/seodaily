import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSearch, parseArticle, publicationErrors, readingMinutes, readableWords, tehranSchedule, canonicalInput, contentLinks } from "../../src/modules/blog/content.ts";
import { emptyArticle } from "../../src/modules/blog/types.ts";
import { outline } from "../../src/modules/blocks/text.ts";
import { isSafeHref } from "../../src/modules/blocks/schema.ts";
const doc = (text) => ({ v: 1, doc: { type: "doc", content: [{ type: "paragraph", attrs: { id: "paragraph1" }, content: [{ type: "text", text }] }] } });
test("Persian reading policy counts ZWNJ words once, tables/code, but excludes reusable CTA copy", () => {
  assert.equal(readableWords(doc("می‌روم  کتاب   كاربردی\nيادگیری 123")), 5);
  assert.equal(readingMinutes(doc("کلمه ".repeat(201))), 2);
  assert.equal(readingMinutes(doc("")), 1);
  const d = doc("یک دو"); d.doc.content.push({ type: "cta", attrs: { text: "کلمه ".repeat(500) } }, { type: "codeBlock", content: [{ type: "text", text: "select one" }] });
  assert.equal(readableWords(d), 4);
  assert.equal(normalizeSearch("  كي ي\u200cك A "), "کی ی ک a");
});
test("Tehran schedule is explicit, valid and stable at day boundaries", () => {
  assert.equal(tehranSchedule("2026-10-01T00:00").toISOString(), "2026-09-30T20:30:00.000Z");
  for (const v of ["2026-02-30T10:00", "2026-10-01", "invalid"]) assert.throws(() => tehranSchedule(v));
});
test("incomplete drafts save; publication requires title, category, image, alt and meaningful text", () => {
  const d = parseArticle(emptyArticle()); assert.ok(publicationErrors(d).length >= 5);
  assert.throws(() => parseArticle({ ...d, readingOverride: 241 }));
  assert.throws(() => parseArticle({ ...d, image: "https://example.com/private.png" }));
  assert.equal(parseArticle({ ...d, readingOverride: 12 }).readingOverride, 12);
  assert.equal(parseArticle({ ...d, readingOverride: "" }).readingOverride, null);
});
test("stable TOC anchors survive heading edits and duplicate headings", () => {
  const d = { v: 1, doc: { type: "doc", content: ["heading01", "heading02"].map((id) => ({ type: "heading", attrs: { id, level: 2 }, content: [{ type: "text", text: "عنوان یکسان" }] })) } };
  const before = outline(d, "article-", true); d.doc.content[0].content[0].text = "ویرایش عنوان";
  assert.deepEqual(outline(d, "article-", true).map((h) => h.anchor), before.map((h) => h.anchor));
  assert.notEqual(before[0].anchor, before[1].anchor);
});
test("canonical and blocks reject script protocols, oversized/unknown editor contracts", () => {
  for (const href of ["javascript:alert(1)", "https://u:p@example.com", "https://example.com?token=private"]) assert.throws(() => canonicalInput(href));
  assert.throws(() => parseArticle({ ...emptyArticle(), content: { v: 999, doc: {} } }));
  const d = doc("safe"); d.doc.content[0].content[0].marks = [{ type: "link", attrs: { href: "javascript:alert(1)" } }];
  assert.throws(() => parseArticle({ ...emptyArticle(), content: d }));
  assert.equal(isSafeHref("entity:article:42"), true); assert.equal(isSafeHref("entity:service:5"), true);
  d.doc.content[0].content[0].marks[0].attrs.href = "entity:article:42";
  assert.deepEqual(contentLinks(d), [{ blockId: "paragraph1", href: "entity:article:42" }]);
});
