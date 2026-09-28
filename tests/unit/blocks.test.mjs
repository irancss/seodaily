// Block-document contract: only the allowed structure is stored (PL-T02 editor data, PL-T30 TOC).
import assert from "node:assert/strict";
import { test } from "node:test";

import { isSafeHref, LIMITS } from "../../src/modules/blocks/schema.ts";
import { documentText, entityLinks, outline } from "../../src/modules/blocks/text.ts";
import { validateBlockDocument } from "../../src/modules/blocks/validate.ts";

const doc = (...content) => ({ v: 1, doc: { type: "doc", content } });
const p = (text, marks) => ({ type: "paragraph", content: [{ type: "text", text, ...(marks ? { marks } : {}) }] });

test("unknown nodes, marks, attributes and scripts never survive", () => {
  const { document, problems } = validateBlockDocument(
    doc(
      { type: "iframe", attrs: { src: "https://evil.example" } },
      { type: "paragraph", attrs: { onclick: "alert(1)", style: "x" }, content: [{ type: "text", text: "hi", marks: [{ type: "fontFamily" }, { type: "bold" }, { type: "link", attrs: { href: "javascript:alert(1)" } }] }] },
      { type: "html", content: [{ type: "text", text: "<script>alert(1)</script>" }] },
    ),
  );
  assert.equal(document.doc.content.length, 1);
  const para = document.doc.content[0];
  assert.deepEqual(Object.keys(para.attrs), ["id"], "only the block id attribute is kept");
  assert.deepEqual(para.content[0].marks, [{ type: "bold" }]);
  assert.ok(problems.length >= 3, problems.join(" | "));
  assert.ok(!JSON.stringify(document).includes("javascript:"));
  assert.ok(!JSON.stringify(document).includes("iframe"));
});

test("links: http(s), site paths, mailto/tel and entity links only", () => {
  for (const ok of ["https://wordpress.org/plugins/x/", "/contact", "mailto:a@b.c", "tel:+989121234567", "entity:plugin:12", "entity:page:contact"]) assert.ok(isSafeHref(ok), ok);
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.example", "vbscript:x", "/path with space", "entity:user:1", " https://x"]) assert.ok(!isSafeHref(bad), bad);
});

test("images must be the site's own uploads; H1 becomes H2; code language whitelisted", () => {
  const { document } = validateBlockDocument(
    doc(
      { type: "figure", attrs: { src: "https://tracker.example/x.png", alt: "x" } },
      { type: "figure", attrs: { src: "/uploads/mf3k2a-0123456789abcdef.png", alt: "نمای پنل", width: 800, height: 450, ratio: "16/9", onload: "x" } },
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "عنوان" }] },
      { type: "codeBlock", attrs: { language: "<img>" }, content: [{ type: "text", text: "<?php echo 1; ?>", marks: [{ type: "bold" }] }] },
    ),
  );
  const [figure, heading, code] = document.doc.content;
  assert.equal(document.doc.content.length, 3, "foreign image dropped");
  assert.equal(figure.attrs.alt, "نمای پنل");
  assert.equal(figure.attrs.onload, undefined);
  assert.equal(heading.attrs.level, 2);
  assert.equal(code.attrs.language, "");
  assert.equal(code.content[0].text, "<?php echo 1; ?>", "code kept as text, never interpreted");
  assert.equal(code.content[0].marks, undefined);
});

test("block ids: kept when valid, regenerated when missing or duplicated", () => {
  const { document } = validateBlockDocument(doc({ ...p("a"), attrs: { id: "abcdefgh1234" } }, { ...p("b"), attrs: { id: "abcdefgh1234" } }, p("c")));
  const ids = document.doc.content.map((n) => n.attrs.id);
  assert.equal(ids[0], "abcdefgh1234");
  assert.equal(new Set(ids).size, 3);
  assert.ok(ids.every((id) => /^[a-z0-9]{8,24}$/.test(id)));
});

test("limits: block count, text size and table size are capped", () => {
  const many = validateBlockDocument(doc(...Array.from({ length: LIMITS.topLevelBlocks + 50 }, (_, i) => p(`p${i}`))));
  assert.equal(many.document.doc.content.length, LIMITS.topLevelBlocks);
  const huge = validateBlockDocument(doc(p("x".repeat(LIMITS.textChars + 500)), p("more")));
  assert.equal(huge.textChars, LIMITS.textChars);
  const row = { type: "tableRow", content: Array.from({ length: 20 }, () => ({ type: "tableCell", content: [p("c")] })) };
  const table = validateBlockDocument(doc({ type: "table", content: Array.from({ length: 60 }, () => row) }));
  assert.equal(table.document.doc.content[0].content.length, LIMITS.tableRows);
  assert.equal(table.document.doc.content[0].content[0].content.length, LIMITS.tableCols);
});

test("garbage and unknown versions give an empty or converted document, never a throw", () => {
  for (const junk of [null, 42, "x", { v: 9 }, { v: 1, doc: "no" }, { v: 1, doc: { content: [null, 5, { type: 3 }] } }]) {
    const { document } = validateBlockDocument(junk);
    assert.equal(document.v, 1);
    assert.ok(Array.isArray(document.doc.content));
  }
});

test("outline: unique anchors (prefixable), text extraction and entity links", () => {
  const d = validateBlockDocument(
    doc(
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "نصب افزونه" }] },
      p("متن", [{ type: "link", attrs: { href: "entity:plugin:7" } }]),
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "نصب افزونه" }] },
      { type: "cta", attrs: { title: "مشاوره", href: "entity:page:contact", label: "تماس" } },
    ),
  ).document;
  const toc = outline(d);
  assert.deepEqual(toc.map((o) => o.anchor), ["نصب-افزونه", "نصب-افزونه-2"]);
  assert.deepEqual(outline(d, "g1-").map((o) => o.anchor), ["g1-نصب-افزونه", "g1-نصب-افزونه-2"]);
  assert.match(documentText(d), /نصب افزونه متن نصب افزونه مشاوره/);
  assert.deepEqual(entityLinks(d), [{ type: "plugin", id: "7" }, { type: "page", id: "contact" }]);
});
