// After-login redirect target: only panel pages, never another site.
import assert from "node:assert/strict";
import { test } from "node:test";

import { safeAdminPath } from "../../src/modules/auth/next-path.ts";

test("panel pages are kept, with their query", () => {
  for (const path of ["/admin", "/admin/leads/42", "/admin/leads?status=new&page=2", "/admin/services/3"]) assert.equal(safeAdminPath(path), path);
});

test("anything else falls back to the dashboard", () => {
  for (const bad of [
    undefined,
    null,
    42,
    "",
    "https://evil.example/admin",
    "//evil.example/admin",
    "/admin//evil.example",
    "/admin/..//evil.example",
    "/\\evil.example",
    "/admin\\evil",
    "/%2F%2Fevil.example",
    "/admin%2F%2Fevil.example",
    "/services",
    "/administrator",
    "/admin/login",
    "javascript:alert(1)",
    "/admin%E0%A4%A",
  ]) {
    assert.equal(safeAdminPath(bad), "/admin", String(bad));
  }
});
