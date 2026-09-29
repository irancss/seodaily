import assert from "node:assert/strict";
import { test } from "node:test";

import { cleanVersion, compareVersions, isPrerelease, parseVersion } from "../../src/modules/plugins/pipeline/versions.ts";

test("PL-T04: numeric comparison, 1.10 > 1.9, missing parts are zero", () => {
  assert.equal(compareVersions("1.10", "1.9"), 1);
  assert.equal(compareVersions("1.9", "1.10"), -1);
  assert.equal(compareVersions("2.0", "2.0.0"), 0);
  assert.equal(compareVersions("3.21.4", "3.21.10"), -1);
});

test("PL-T04: v prefix, Persian and Arabic digits, labels", () => {
  assert.equal(cleanVersion("v3.2.1"), "3.2.1");
  assert.equal(cleanVersion("نسخه ۳.۲.۱"), "3.2.1");
  assert.equal(cleanVersion("Version: ٢.٥"), "2.5");
  assert.equal(compareVersions("۱.۱۰", "v1.9"), 1);
});

test("PL-T04: pre-releases sort below the stable release and in label order", () => {
  assert.ok(isPrerelease("2.0.0-beta.2"));
  assert.ok(isPrerelease("2.0rc1"));
  assert.ok(!isPrerelease("2.0.0"));
  assert.equal(compareVersions("2.0.0", "2.0.0-rc1"), 1);
  assert.equal(compareVersions("2.0.0-beta2", "2.0.0-beta10"), -1);
  assert.equal(compareVersions("2.0.0-alpha", "2.0.0-beta"), -1);
  assert.equal(compareVersions("2.0.1-beta", "2.0.0"), 1);
});

test("PL-T04: unknown strings are incomparable, never 'highest'", () => {
  assert.equal(parseVersion("latest"), null);
  assert.equal(parseVersion("1.2.3-hotfix"), null);
  assert.equal(parseVersion(""), null);
  assert.equal(compareVersions("latest", "1.0"), null);
  assert.equal(compareVersions("9.9.9", "banana"), null);
});
