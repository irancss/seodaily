// PL-T04..T07, T10, T12..T16: source selection, package checks, gate,
// retention and the job queue, against a throwaway database and a local
// fixture HTTP server (test-only private-address allowance).
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

import { freshDatabase } from "../support/fresh-db.mjs";
import { fixtureServer } from "../support/fixture-server.mjs";
import { pluginZip } from "../support/zip-builder.mjs";

process.env.PLUGIN_FILES_DIR = mkdtempSync(path.join(tmpdir(), "plfiles-"));
process.env.PLUGIN_FETCH_ALLOW_PRIVATE_FOR_TESTS = "127.0.0.1/32";
process.env.PLUGIN_DISK_MIN_FREE_MB = "100";
const sql = await freshDatabase("it_pipeline");
const { checkPlugin } = await import("../../src/modules/plugins/pipeline/check.ts");
const { pipelineConfig } = await import("../../src/modules/plugins/pipeline/config.ts");
const { publishRelease, ReleaseError } = await import("../../src/modules/plugins/pipeline/releases.ts");
const { objectPath } = await import("../../src/modules/plugins/pipeline/storage.ts");
const jobs = await import("../../src/modules/plugins/pipeline/jobs.ts");
const { runScheduleTick } = await import("../../src/modules/plugins/pipeline/schedule.ts");

const srv = await fixtureServer();
after(() => srv.close());
const cfg = pipelineConfig();
const PASS = (detail = "test") => ({ status: "PASS", detail });
const passingSandbox = { available: true, run: async () => PASS("fixture sandbox") };
const unavailableSandbox = { available: false, run: async () => ({ status: "UNAVAILABLE", detail: "no runner" }) };
function ctx(over = {}) {
  const log = [];
  return {
    log,
    ctx: { cfg, scan: async () => PASS("fixture scan"), sandbox: passingSandbox, log: (l) => log.push(l), stillOwned: async () => true, invalidate: async () => {}, hostDelayMs: 0, ...over },
  };
}
let seq = 0;
async function newPlugin({ originalName = "Hello Test", autoUpdate = true } = {}) {
  seq++;
  const [p] = await sql`insert into plugins (slug, name, original_name, auto_update) values (${`p${seq}`}, ${`P ${seq}`}, ${originalName}, ${autoUpdate}) returning id`;
  return p.id;
}
async function addSource(pluginId, { page, priority = 10, adapter = "auto", downloadUrl = "" }) {
  const [s] = await sql`insert into plugin_sources (plugin_id, url, priority, adapter, download_url) values (${pluginId}, ${srv.base + page}, ${priority}, ${adapter}, ${downloadUrl}) returning id`;
  return s.id;
}
function page(version, zipPath) {
  return `<html><body><h1>Hello Test</h1><p>نسخه: ${version}</p><a href="${zipPath}">دانلود فایل</a><a href="/demo">دمو</a></body></html>`;
}
function serveZip(p, opts) {
  srv.set(p, { type: "application/zip", body: pluginZip(opts) });
}
const releases = (pluginId) => sql`select id, source_version, package_version, state, downloadable, warnings, checks, sha256, storage_key from plugin_releases where plugin_id = ${pluginId} order by id`;

test("PL-T04: the newest version wins even from a lower-priority source; first release needs review (no identity reference)", async () => {
  const id = await newPlugin({ originalName: "" });
  await addSource(id, { page: "/a/1", priority: 1 });
  await addSource(id, { page: "/a/2", priority: 5 });
  srv.set("/a/1", { body: page("1.9", "/a/one.zip") });
  srv.set("/a/2", { body: page("1.10", "/a/two.zip") });
  serveZip("/a/one.zip", { version: "1.9" });
  serveZip("/a/two.zip", { version: "1.10" });
  const { ctx: c } = ctx();
  const out = await checkPlugin(id, c);
  assert.equal(out.status, "review");
  const rows = await releases(id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_version, "1.10");
  assert.equal(rows[0].checks.identity.status, "WARNING");
  assert.equal(rows[0].checks.checksum.status, "UNAVAILABLE", "no official checksum reference is UNAVAILABLE, never PASS (PL-T12)");
});

test("PL-T04/T13: all checks PASS → auto-publish, bound to the checked hash", async () => {
  const id = await newPlugin();
  await addSource(id, { page: "/b/1" });
  srv.set("/b/1", { body: page("2.0.0", "/b/p.zip") });
  serveZip("/b/p.zip", { version: "2.0.0" });
  let invalidated = 0;
  const { ctx: c } = ctx({ invalidate: async () => void invalidated++ });
  const out = await checkPlugin(id, c);
  assert.equal(out.status, "updated");
  assert.equal(invalidated, 1);
  const [plugin] = await sql`select current_release_id, package_updated_at, requires_wp, author_name, provenance from plugins where id = ${id}`;
  const [rel] = await releases(id);
  assert.equal(plugin.current_release_id, rel.id);
  assert.equal(rel.state, "published");
  assert.equal(plugin.requires_wp, "6.0");
  assert.equal(plugin.author_name, "Example Author");
  assert.match(plugin.provenance.requiresWp, /header/);
  // Second run: nothing new, up to date, no duplicate rows.
  const again = await checkPlugin(id, c);
  assert.equal(again.status, "up_to_date");
  assert.equal((await releases(id)).length, 1);
});

test("PL-T13: a stored file that no longer matches its checked hash is never published", async () => {
  const id = await newPlugin();
  await addSource(id, { page: "/c/1" });
  srv.set("/c/1", { body: page("1.0.0", "/c/p.zip") });
  serveZip("/c/p.zip", { version: "1.0.0" });
  const { ctx: c } = ctx({ sandbox: unavailableSandbox });
  assert.equal((await checkPlugin(id, c)).status, "review");
  const [rel] = await releases(id);
  const file = objectPath(cfg.filesDir, rel.storage_key);
  const original = readFileSync(file);
  writeFileSync(file, Buffer.concat([original, Buffer.from("tamper")]));
  await assert.rejects(publishRelease(rel.id, { userId: null, source: "admin", override: "test" }), (e) => e instanceof ReleaseError && /هش/.test(e.message));
  writeFileSync(file, original);
  // With the real bytes back, an admin can publish it with a written reason (sandbox UNAVAILABLE).
  await assert.rejects(publishRelease(rel.id, { userId: null, source: "admin" }), /دلیل/);
  await publishRelease(rel.id, { userId: null, source: "admin", override: "بررسی دستی فایل" });
  const [after] = await releases(id);
  assert.equal(after.state, "published");
});

test("PL-T10: scanner unavailable or sandbox unavailable is not PASS; auto-publish stays closed", async () => {
  const id = await newPlugin();
  await addSource(id, { page: "/d/1" });
  srv.set("/d/1", { body: page("3.1", "/d/p.zip") });
  serveZip("/d/p.zip", { version: "3.1" });
  const { ctx: c } = ctx({ scan: async () => ({ status: "UNAVAILABLE", detail: "clamd down" }) });
  const out = await checkPlugin(id, c);
  assert.equal(out.status, "review");
  assert.ok(out.review[0].reasons.some((r) => r.startsWith("scan: UNAVAILABLE")));
  const [plugin] = await sql`select current_release_id from plugins where id = ${id}`;
  assert.equal(plugin.current_release_id, null);
});

test("PL-T06: source/package version mismatch is only a warning; another plugin's package fails identity", async () => {
  const id = await newPlugin();
  await addSource(id, { page: "/e/1" });
  srv.set("/e/1", { body: page("4.0", "/e/p.zip") });
  serveZip("/e/p.zip", { version: "4.0.1" });
  const { ctx: c } = ctx();
  const out = await checkPlugin(id, c);
  assert.equal(out.status, "updated", "a mismatch alone does not stop the publish");
  const [rel] = await releases(id);
  assert.equal(rel.source_version, "4.0");
  assert.equal(rel.package_version, "4.0.1");
  assert.equal(rel.checks.version.status, "WARNING");
  // Next version comes from a different plugin folder / text domain.
  srv.set("/e/1", { body: page("4.1", "/e/q.zip") });
  serveZip("/e/q.zip", { version: "4.1", folder: "other-plugin", name: "Other" });
  const out2 = await checkPlugin(id, c);
  assert.equal(out2.rejected[0].version, "4.1");
  assert.match(out2.rejected[0].reason, /identity/);
  const rows = await releases(id);
  assert.equal(rows.find((r) => r.source_version === "4.1").state, "rejected");
  const [plugin] = await sql`select current_release_id from plugins where id = ${id}`;
  assert.equal(plugin.current_release_id, rel.id, "the healthy current release stays");
});

test("PL-T05/T07: a failing source falls back; same version with another file is a warned candidate, never a silent overwrite", async () => {
  const id = await newPlugin();
  await addSource(id, { page: "/f/1", priority: 1 });
  await addSource(id, { page: "/f/2", priority: 2 });
  srv.set("/f/1", { body: page("5.0", "/f/a.zip") });
  srv.set("/f/2", { body: page("5.0", "/f/b.zip") });
  serveZip("/f/a.zip", { version: "5.0" });
  srv.set("/f/b.zip", { type: "application/zip", body: pluginZip({ version: "5.0", extra: [{ name: "hello-test/extra.txt", data: "different" }] }) });
  const { ctx: c } = ctx();
  assert.equal((await checkPlugin(id, c)).status, "updated");
  // Next: the preferred source breaks (404), the other one announces 5.1.
  srv.set("/f/1", { status: 404, body: "gone" });
  srv.set("/f/2", { body: page("5.1", "/f/c.zip") });
  serveZip("/f/c.zip", { version: "5.1" });
  const out = await checkPlugin(id, c);
  assert.equal(out.status, "updated");
  assert.equal(out.published.version, "5.1");
  const sources = await sql`select last_status, consecutive_failures from plugin_sources where plugin_id = ${id} order by priority`;
  assert.equal(sources[0].last_status, "error");
  assert.equal(sources[0].consecutive_failures, 1);
  // PL-T07: source 1 comes back announcing the current 5.1 with different bytes → a warned candidate for review.
  srv.set("/f/1", { body: page("5.1", "/f/d.zip") });
  srv.set("/f/d.zip", { type: "application/zip", body: pluginZip({ version: "5.1", extra: [{ name: "hello-test/x.txt", data: "x" }] }) });
  const out2 = await checkPlugin(id, c);
  assert.equal(out2.status, "review");
  const rows = (await releases(id)).filter((r) => r.source_version === "5.1");
  assert.equal(rows.length, 2);
  const other = rows.find((r) => r.state === "review");
  assert.ok(other.warnings.some((w) => /فایل دیگری/.test(w)));
  assert.ok(out2.review[0].reasons.some((r) => /فایل دیگری/.test(r)));
  const [plugin] = await sql`select current_release_id from plugins where id = ${id}`;
  assert.equal(plugin.current_release_id, rows.find((r) => r.state === "published").id, "no silent overwrite of the current file");
  // The same bytes from another source are verified once and then remembered.
  const id2 = await newPlugin();
  await addSource(id2, { page: "/f/3", priority: 1 });
  await addSource(id2, { page: "/f/4", priority: 2 });
  srv.set("/f/3", { body: page("7.0", "/f/e.zip") });
  srv.set("/f/4", { body: page("7.0", "/f/e.zip") });
  serveZip("/f/e.zip", { version: "7.0" });
  assert.equal((await checkPlugin(id2, c)).status, "updated");
  const before = srv.hits.filter((h) => h === "/f/e.zip").length;
  await checkPlugin(id2, c);
  await checkPlugin(id2, c);
  assert.equal(srv.hits.filter((h) => h === "/f/e.zip").length, before + 1, "one comparison download, then remembered");
});

test("PL-T09: HTML instead of ZIP is rejected; the current release is untouched", async () => {
  const id = await newPlugin();
  await addSource(id, { page: "/g/1" });
  srv.set("/g/1", { body: page("1.0", "/g/p.zip") });
  srv.set("/g/p.zip", { type: "text/html", body: "<!doctype html><html>login</html>" });
  const { ctx: c } = ctx();
  const out = await checkPlugin(id, c);
  assert.equal(out.rejected.length, 1);
  assert.match(out.rejected[0].reason, /HTML/);
});

test("PL-T14: a fourth published version leaves exactly three downloadable, the newest current", async () => {
  const id = await newPlugin();
  await addSource(id, { page: "/h/1" });
  const { ctx: c } = ctx();
  for (const v of ["1.0", "1.1", "1.2", "1.3"]) {
    srv.set("/h/1", { body: page(v, `/h/${v}.zip`) });
    serveZip(`/h/${v}.zip`, { version: v });
    assert.equal((await checkPlugin(id, c)).status, "updated", v);
  }
  const rows = await releases(id);
  const live = rows.filter((r) => r.downloadable).map((r) => r.source_version).sort();
  assert.deepEqual(live, ["1.1", "1.2", "1.3"]);
  assert.equal(rows.find((r) => r.source_version === "1.0").state, "retired");
  const [plugin] = await sql`select current_release_id from plugins where id = ${id}`;
  assert.equal(plugin.current_release_id, rows.find((r) => r.source_version === "1.3").id);
});

test("PL-T16: one logical job per plugin, lease recovery, fencing, backoff", async () => {
  const id = await newPlugin();
  const a = await jobs.enqueueCheck(id, "admin", `manual:${id}:1`);
  const b = await jobs.enqueueCheck(id, "schedule", `nightly:x:${id}`);
  assert.equal(a.created, true);
  assert.equal(b.created, false);
  assert.equal(b.id, a.id, "the nightly run joins the queued manual check");
  const job = await jobs.claimJob("w1");
  assert.equal(job.id, a.id);
  assert.equal(await jobs.claimJob("w2"), null, "no second claim");
  // Lease expires (worker crashed) → back to the queue; the old holder is fenced out.
  await sql`update plugin_jobs set lease_until = now() - interval '1 second' where id = ${job.id}`;
  await jobs.recoverExpired();
  const again = await jobs.claimJob("w2");
  assert.equal(again.id, job.id);
  assert.equal(await jobs.heartbeat(job, "w1"), false, "stale worker cannot renew");
  assert.equal(await jobs.finishJob(job, { stale: true }), false, "stale worker cannot finish");
  assert.equal(await jobs.heartbeat(again, "w2"), true);
  await jobs.failJob(again, "boom");
  const [row] = await sql`select state, run_after > now() as later from plugin_jobs where id = ${job.id}`;
  assert.equal(row.state, "queued");
  assert.equal(row.later, true, "retry is delayed (backoff)");
});

test("PL-T16/T17: the nightly slot is queued once, however many workers tick", async () => {
  const id = await newPlugin();
  await addSource(id, { page: "/i/1" });
  const now = new Date("2026-10-01T00:00:00Z"); // 03:30 Tehran
  const results = await Promise.all([runScheduleTick(now), runScheduleTick(now), runScheduleTick(now)]);
  assert.deepEqual(results.filter(Boolean), ["2026-10-01"]);
  const [n] = await sql`select count(*)::int as n from plugin_jobs where idempotency_key like 'nightly:2026-10-01:%'`;
  assert.ok(n.n >= 1);
  assert.equal(await runScheduleTick(new Date("2026-10-01T10:00:00Z")), null, "later the same Tehran day: nothing new");
});

test("PL-T03: a value the admin typed is never overwritten by package metadata", async () => {
  const id = await newPlugin();
  await sql`update plugins set requires_wp = '5.9', manual_fields = '["requiresWp"]'::jsonb, excerpt = 'متن مدیر', seo_title = 'عنوان مدیر' where id = ${id}`;
  await addSource(id, { page: "/j/1" });
  srv.set("/j/1", { body: page("8.0", "/j/p.zip") });
  serveZip("/j/p.zip", { version: "8.0" });
  const { ctx: c } = ctx();
  assert.equal((await checkPlugin(id, c)).status, "updated");
  const [p] = await sql`select requires_wp, requires_php, excerpt, seo_title from plugins where id = ${id}`;
  assert.equal(p.requires_wp, "5.9", "manual field kept");
  assert.equal(p.requires_php, "7.4", "non-manual field filled from the header");
  assert.equal(p.excerpt, "متن مدیر");
  assert.equal(p.seo_title, "عنوان مدیر");
});

test("PL-T15: cleanup keeps files a live link or transfer may need, and SHA-shared files", async () => {
  const { deletableObjects } = await import("../../src/modules/plugins/pipeline/releases.ts");
  const id = await newPlugin();
  const key = (n) => `objects/aa/${String(n).padStart(64, "b")}.zip`;
  const [a] = await sql`insert into plugin_releases (plugin_id, source_version, sha256, bytes, storage_key, state, retired_at) values (${id}, '1', ${String(1).padStart(64, "b")}, 1, ${key(1)}, 'retired', now() - interval '3 hours') returning id`;
  const [b] = await sql`insert into plugin_releases (plugin_id, source_version, sha256, bytes, storage_key, state, retired_at) values (${id}, '2', ${String(2).padStart(64, "b")}, 1, ${key(2)}, 'retired', now() - interval '3 hours') returning id`;
  const [cRow] = await sql`insert into plugin_releases (plugin_id, source_version, sha256, bytes, storage_key, state, retired_at) values (${id}, '3', ${String(3).padStart(64, "b")}, 1, ${key(3)}, 'retired', now() - interval '5 minutes') returning id`;
  const other = await newPlugin();
  await sql`insert into plugin_releases (plugin_id, source_version, sha256, bytes, storage_key, state, downloadable, published_at) values (${other}, '9', ${String(2).padStart(64, "b")}, 1, ${key(2)}, 'published', true, now())`;
  const [u] = await sql`insert into download_users (phone) values ('+989120000777') returning id`;
  const [s] = await sql`insert into download_sessions (token_digest, user_id, expires_at) values ('t-15', ${u.id}, now() + interval '1 day') returning id`;
  await sql`insert into download_grants (id, user_id, session_id, release_id, sha256, expires_at) values ('g15-live-grant-0000000000000000', ${u.id}, ${s.id}, ${a.id}, 'x', now() + interval '5 minutes')`;
  const due = await deletableObjects();
  const ids = due.map((d) => d.id);
  assert.ok(!ids.includes(a.id), "a live link keeps the file");
  assert.ok(!ids.includes(cRow.id), "inside the retirement grace period");
  const shared = due.find((d) => d.id === b.id);
  assert.ok(shared && shared.shared, "bytes shared with another plugin's published release are marked shared (row closed, file kept)");
});
