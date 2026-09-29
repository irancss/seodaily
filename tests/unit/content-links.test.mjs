import assert from "node:assert/strict";
import { test } from "node:test";
import { contentHref } from "../../src/lib/content-links.ts";

test("editorial links to the canonical origin remain internal, including Persian paths and fragments", () => {
  const base = "https://seodaily.ir";
  assert.equal(contentHref(`${base}/contact?service=seo#contact-form`, base), "/contact?service=seo#contact-form");
  assert.equal(contentHref(`${base}/blog/سئو`, base), "/blog/%D8%B3%D8%A6%D9%88");
  assert.equal(contentHref(`${base}/`, base), "/");
  for (const href of ["/services", "entity:page:contact", "mailto:hello@example.test", "https://seodaily.ir.example.test/contact", "https://example.test/contact", "https://user:pass@seodaily.ir/contact", "https://seodaily.ir//example.test/contact", "https://["]) assert.equal(contentHref(href, base), href);
});
