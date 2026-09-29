import assert from "node:assert/strict";
import { test } from "node:test";
import { isPluginSelfCanonical } from "../../src/modules/plugins/seo.ts";

test("plugin and category sitemap canonical checks include origin, path and query", () => {
  const base = "https://seodaily.ir";
  for (const canonical of ["", "  ", "/plugins/example", `${base}/plugins/example`]) {
    assert.equal(isPluginSelfCanonical(base, "example", canonical), true, canonical);
  }
  for (const canonical of ["https://other.example/plugins/example", "http://seodaily.ir/plugins/example", "/plugins/other", "/plugins/example?page=2", "/plugins/example#section", "https://["]) {
    assert.equal(isPluginSelfCanonical(base, "example", canonical), false, canonical);
  }
});

test("a Persian self-canonical is recognised in Unicode and URL-encoded forms", () => {
  const base = "https://seodaily.ir";
  const slug = "افزونه";
  for (const canonical of [`/plugins/${slug}`, `${base}/plugins/${slug}`, `${base}/plugins/${encodeURIComponent(slug)}`]) {
    assert.equal(isPluginSelfCanonical(base, slug, canonical), true, canonical);
  }
  assert.equal(isPluginSelfCanonical(base, slug, `https://other.example/plugins/${slug}`), false);
});
