// Slugs of /plugins/{slug} (and the future /blog namespace).
import assert from "node:assert/strict";
import { test } from "node:test";

import { isReservedSlug, looseSlugFromPath, normalizeSlug, slugFromPath } from "../../src/modules/slugs/normalize.ts";

test("latin, persian, digits and separators get one canonical form", () => {
  assert.equal(normalizeSlug("  Elementor Pro "), "elementor-pro");
  assert.equal(normalizeSlug("elementor_pro"), "elementor-pro");
  assert.equal(normalizeSlug("افزونه‌سئو"), "افزونه-سئو", "zero-width non-joiner becomes a hyphen");
  assert.equal(normalizeSlug("ووکامرس ۲"), "ووکامرس-2", "persian digits");
  assert.equal(normalizeSlug("٣ افزونه"), "3-افزونه", "arabic digits");
  assert.equal(normalizeSlug("سيو كامل"), "سیو-کامل", "arabic yeh/kaf written as persian");
  assert.equal(normalizeSlug("--a---b--"), "a-b");
  assert.equal(normalizeSlug("مُحتوا"), "محتوا", "diacritics dropped");
  assert.equal(normalizeSlug(normalizeSlug("Yoast SEO Premium")), "yoast-seo-premium", "idempotent");
});

test("nothing that can form a path or an encoding survives", () => {
  for (const bad of ["../etc", "a/b", "a\\b", "%2f", "a%2Fb", "..", "<script>", "a.b"]) {
    assert.doesNotMatch(normalizeSlug(bad), /[./\\%<>]/, bad);
  }
  assert.equal(normalizeSlug("!!!"), "");
  assert.equal(normalizeSlug("x".repeat(200)).length, 80);
});

test("request segments: only canonical slugs are exact; encoded tricks are rejected", () => {
  assert.equal(slugFromPath("elementor-pro"), "elementor-pro");
  assert.equal(slugFromPath("Elementor-Pro"), null, "not canonical");
  assert.equal(looseSlugFromPath("Elementor-Pro"), "elementor-pro", "redirect target");
  for (const bad of ["%2f", "a%252f", "..", "a/..", "a\\b", ""]) {
    assert.equal(slugFromPath(bad), null, bad);
    assert.equal(looseSlugFromPath(bad), null, bad);
  }
});

test("route words are reserved per namespace", () => {
  assert.ok(isReservedSlug("plugins", "download"));
  assert.ok(isReservedSlug("plugins", "updates"));
  assert.ok(!isReservedSlug("plugins", "seo"));
  assert.ok(isReservedSlug("blog", "tag"));
});
