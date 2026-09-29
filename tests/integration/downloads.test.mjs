// PL-T19..T28: OTP, sessions, grants, quotas and counting, on a throwaway
// database with an in-memory SMS provider (test only).
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { freshDatabase } from "../support/fresh-db.mjs";

process.env.OTP_HMAC_SECRET = "test-only-otp-secret-test-only-otp-secret";
process.env.PLUGIN_FILES_DIR = mkdtempSync(path.join(tmpdir(), "dlfiles-"));
const sql = await freshDatabase("it_downloads");
const otp = await import("../../src/modules/downloads/otp.ts");
const grants = await import("../../src/modules/downloads/grants.ts");

const outbox = [];
const provider = { name: "memory", sendVerification: async ({ to, code, requestId }) => (outbox.push({ to, code, requestId }), { state: "sent", ref: "m1234567", error: "" }) };
const failing = { name: "failing", sendVerification: async () => ({ state: "failed", ref: "", error: "credit" }) };
let t0 = Date.parse("2026-10-01T10:00:00Z");
const at = (s) => new Date(t0 + s * 1000);
let phoneSeq = 1000000;
const newPhone = () => `0912${phoneSeq++}`;

async function send(phone, s = 0, ip = "ip-a") {
  const r = await otp.requestOtp({ phone, ipHash: ip, provider, templateId: "1", now: at(s) });
  return { ...r, code: outbox.at(-1).code };
}

test("PL-T19: 4-digit string code, leading zeros kept, HMAC only in the DB, expiry at second 120, one use", async () => {
  const phone = newPhone();
  const r = await send(phone);
  assert.match(r.code, /^\d{4}$/);
  const [row] = await sql`select digest, expires_at from otp_challenges where id = ${r.challengeId}`;
  assert.ok(!row.digest.includes(r.code) && row.digest.length === 64, "no plaintext code stored");
  await assert.rejects(otp.verifyOtp({ challengeId: r.challengeId, phone, code: r.code, ipHash: "ip-a", now: at(120) }), /مهلت/);
  const r2 = await send(phone, 60);
  const ok = await otp.verifyOtp({ challengeId: r2.challengeId, phone, code: r2.code, ipHash: "ip-a", now: at(179) });
  assert.ok(ok.sessionToken.length >= 40);
  await assert.rejects(otp.verifyOtp({ challengeId: r2.challengeId, phone, code: r2.code, ipHash: "ip-a", now: at(180) }), /معتبر نیست/);
  // Leading zeros survive: digests of "0047" and "47" differ.
  await assert.rejects(otp.verifyOtp({ challengeId: r2.challengeId, phone, code: "47", ipHash: "ip-a", now: at(181) }), /کامل/);
});

test("PL-T19: purpose/phone tampering and unknown challenges get the same refusal", async () => {
  const phone = newPhone();
  const r = await send(phone, 1000);
  await assert.rejects(otp.verifyOtp({ challengeId: r.challengeId, phone: newPhone(), code: r.code, ipHash: "ip-a", now: at(1001) }), /نادرست یا منقضی/);
  await assert.rejects(otp.verifyOtp({ challengeId: "A".repeat(24), phone, code: r.code, ipHash: "ip-a", now: at(1001) }), /نادرست یا منقضی/);
});

test("PL-T20: five attempts, counted atomically under parallel guesses; resend before 60 s refused; resend does not reset abuse counters", async () => {
  const phone = newPhone();
  const r = await send(phone, 2000);
  await assert.rejects(send(phone, 2030), /ثانیه/);
  const wrong = r.code === "0000" ? "1111" : "0000";
  const results = await Promise.allSettled(Array.from({ length: 8 }, () => otp.verifyOtp({ challengeId: r.challengeId, phone, code: wrong, ipHash: "ip-b", now: at(2001) })));
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 0);
  const [row] = await sql`select attempts from otp_challenges where id = ${r.challengeId}`;
  assert.equal(row.attempts, 5, "never more than five counted guesses");
  await assert.rejects(otp.verifyOtp({ challengeId: r.challengeId, phone, code: r.code, ipHash: "ip-b", now: at(2002) }), /تلاش/);
  // Resends up to the hourly cap, failed attempts keep counting across challenges.
  for (const s of [2061, 2122]) {
    const c = await send(phone, s);
    const bad = c.code === "0000" ? "1111" : "0000";
    for (let i = 0; i < 5; i++) await otp.verifyOtp({ challengeId: c.challengeId, phone, code: bad, ipHash: "ip-b", now: at(s + 1) }).catch(() => {});
  }
  await assert.rejects(send(phone, 2200), /کد زیادی/, "15 failures in the hour lock the number, whatever the resends");
});

test("PL-T21: a provider failure is reported and the challenge is void; no automatic resend", async () => {
  const phone = newPhone();
  await assert.rejects(otp.requestOtp({ phone, ipHash: "ip-c", provider: failing, templateId: "1", now: at(3000) }), /ناموفق/);
  const [row] = await sql`select send_state, invalidated_at is not null as void from otp_challenges where phone = ${"+98" + phone.slice(1)} order by created_at desc limit 1`;
  assert.equal(row.send_state, "failed");
  assert.equal(row.void, true);
});

test("PL-T18/T22: one user per number across spellings; session valid 30 days, revocable", async () => {
  const local = newPhone();
  const a = await send(local, 4000);
  const s1 = await otp.verifyOtp({ challengeId: a.challengeId, phone: local, code: a.code, ipHash: "ip-d", now: at(4001) });
  const intl = "+98" + local.slice(1);
  const b = await send(intl, 4100);
  const s2 = await otp.verifyOtp({ challengeId: b.challengeId, phone: "۰" + local.slice(1).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]), code: b.code, ipHash: "ip-d", now: at(4101) });
  assert.equal(s1.userId, s2.userId);
  const [{ n }] = await sql`select count(*)::int as n from download_users where phone = ${intl}`;
  assert.equal(n, 1);
  assert.ok(await otp.sessionFromToken(s1.sessionToken, at(4200)));
  assert.equal(await otp.sessionFromToken(s1.sessionToken, new Date(t0 + 4001_000 + 30 * 86400_000 + 1000)), null, "expires after 30 days");
  await otp.revokeSession(s1.sessionId);
  assert.equal(await otp.sessionFromToken(s1.sessionToken, at(4200)), null);
  assert.ok(await otp.sessionFromToken(s2.sessionToken, at(4200)), "another browser keeps its own session");
  await sql`update download_users set blocked = true where id = ${s2.userId}`;
  assert.equal(await otp.sessionFromToken(s2.sessionToken, at(4200)), null, "blocking a user ends every session");
  await sql`update download_users set blocked = false where id = ${s2.userId}`;
});

// ---- grants ----
async function publishedRelease(n) {
  const [p] = await sql`insert into plugins (slug, name, status) values (${`dl-${n}-${Math.random()}`}, ${"P"}, 'published') returning id`;
  const [r] = await sql`insert into plugin_releases (plugin_id, source_version, sha256, bytes, storage_key, state, downloadable, published_at)
    values (${p.id}, '1.0', ${String(n).padStart(64, "a")}, 10, ${`objects/aa/${String(n).padStart(64, "a")}.zip`}, 'published', true, now()) returning id`;
  return { pluginId: p.id, releaseId: r.id };
}
async function session(ip = "ip-g") {
  const phone = newPhone();
  const c = await send(phone, 0 + Math.random(), ip);
  return otp.verifyOtp({ challengeId: c.challengeId, phone, code: c.code, ipHash: ip, now: at(1) });
}

test("PL-T23/T24: no grant without the owning session; 10-minute links; HEAD never starts; withdrawn files refused even with an old link", async () => {
  t0 = Date.now() - 5000;
  const s = await session();
  const other = await session();
  const rel = await publishedRelease(1);
  const g = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rel.releaseId, ipHash: "ip-g" });
  await assert.rejects(grants.authorizeFile({ grantId: g.grantId, sessionId: other.sessionId, ipHash: "ip-g", start: true }), (e) => e.status === 404);
  await grants.authorizeFile({ grantId: g.grantId, sessionId: s.sessionId, ipHash: "ip-g", start: false });
  const [head] = await sql`select started_at from download_grants where id = ${g.grantId}`;
  assert.equal(head.started_at, null, "HEAD does not start a download");
  await assert.rejects(grants.authorizeFile({ grantId: g.grantId, sessionId: s.sessionId, ipHash: "ip-g", start: true, now: new Date(g.expiresAt.getTime() + 1) }), (e) => e.status === 410);
  const again = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rel.releaseId, ipHash: "ip-g" });
  assert.equal(again.grantId, g.grantId, "an unused, fresh link is reused instead of piling up");
  await sql`update plugin_releases set state = 'withdrawn', downloadable = false where id = ${rel.releaseId}`;
  await assert.rejects(grants.authorizeFile({ grantId: g.grantId, sessionId: s.sessionId, ipHash: "ip-g", start: true }), (e) => e.status === 410);
  await assert.rejects(grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rel.releaseId, ipHash: "ip-g" }), (e) => e.status === 404);
});

test("PL-T25/T26: 21st logical download of a number in an hour is refused; resumes and new links for the same file do not count", async () => {
  const s = await session("ip-q1");
  const rels = [];
  for (let i = 0; i < 21; i++) rels.push(await publishedRelease(100 + i));
  for (let i = 0; i < 20; i++) {
    const g = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rels[i].releaseId, ipHash: `ip-q-${i}` });
    await grants.authorizeFile({ grantId: g.grantId, sessionId: s.sessionId, ipHash: `ip-q-${i}`, start: true });
    await grants.authorizeFile({ grantId: g.grantId, sessionId: s.sessionId, ipHash: `ip-q-${i}`, start: true }); // resume
  }
  // A fresh link for an already started file: no new quota.
  await sql`update download_grants set expires_at = now() - interval '1 second' where user_id = ${s.userId} and release_id = ${rels[0].releaseId}`;
  const again = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rels[0].releaseId, ipHash: "ip-q-x" });
  await grants.authorizeFile({ grantId: again.grantId, sessionId: s.sessionId, ipHash: "ip-q-x", start: true });
  const g21 = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rels[20].releaseId, ipHash: "ip-q-y" });
  await assert.rejects(grants.authorizeFile({ grantId: g21.grantId, sessionId: s.sessionId, ipHash: "ip-q-y", start: true }), (e) => e.status === 429 && e.retryAfterS > 0);
});

test("PL-T25: 41st logical download from one address is refused, also with parallel requests", async () => {
  const users = [];
  for (let i = 0; i < 3; i++) users.push(await session("ip-shared"));
  const rels = [];
  for (let i = 0; i < 42; i++) rels.push(await publishedRelease(300 + i));
  const jobs = [];
  for (let i = 0; i < 42; i++) {
    const u = users[i % 3];
    const g = await grants.issueGrant({ sessionId: u.sessionId, userId: u.userId, releaseId: rels[i].releaseId, ipHash: "ip-shared" });
    jobs.push(grants.authorizeFile({ grantId: g.grantId, sessionId: u.sessionId, ipHash: "ip-shared", start: true }));
  }
  const res = await Promise.allSettled(jobs);
  assert.equal(res.filter((r) => r.status === "fulfilled").length, 40);
  assert.ok(res.filter((r) => r.status === "rejected").every((r) => r.reason.status === 429));
});

test("PL-T26/T27/T28: served is counted once per grant, concurrently; tests/bots and failures are not counted; base count stays separate", async () => {
  const s = await session("ip-c1");
  const rel = await publishedRelease(900);
  await sql`update plugins set base_download_count = 500 where id = ${rel.pluginId}`;
  const g = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rel.releaseId, ipHash: "ip-c1" });
  const a = await grants.authorizeFile({ grantId: g.grantId, sessionId: s.sessionId, ipHash: "ip-c1", start: true });
  await grants.markFailed(a, 3, "connection closed before the end");
  await Promise.all(Array.from({ length: 5 }, () => grants.markServed(a, 10)));
  const g2 = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rel.releaseId, ipHash: "ip-c1" });
  assert.notEqual(g2.grantId, g.grantId);
  const a2 = await grants.authorizeFile({ grantId: g2.grantId, sessionId: s.sessionId, ipHash: "ip-c1", start: true });
  await grants.markServed(a2, 10, { notCounted: "automated client" });
  const [p] = await sql`select base_download_count, measured_download_count from plugins where id = ${rel.pluginId}`;
  assert.equal(p.measured_download_count, 1);
  assert.equal(p.base_download_count, 500);
  const [ledger] = await sql`select count(*) filter (where kind = 'served')::int as served, count(*) filter (where kind = 'unknown')::int as unknown, count(*) filter (where kind = 'failed')::int as failed, count(*) filter (where kind = 'grant_issued')::int as issued from download_events where plugin_id = ${rel.pluginId}`;
  assert.deepEqual(ledger, { served: 1, unknown: 1, failed: 1, issued: 2 });
  const [{ reconciled }] = await sql`select (select count(*) from download_events e where e.plugin_id = p.id and e.kind = 'served')::int = p.measured_download_count as reconciled from plugins p where p.id = ${rel.pluginId}`;
  assert.equal(reconciled, true, "the counter matches the ledger");
});

test("suffix ranges cannot inflate counts; overlapping resumes count once only after complete coverage", async () => {
  const s = await session("ip-range"), rel = await publishedRelease(990);
  const g = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rel.releaseId, ipHash: "ip-range" });
  const a = await grants.authorizeFile({ grantId: g.grantId, sessionId: s.sessionId, ipHash: "ip-range", start: true });
  await grants.markServed(a, 1, { start: 9 });
  await grants.markServed(a, 4, { start: 0 });
  assert.equal((await sql`select measured_download_count from plugins where id=${rel.pluginId}`)[0].measured_download_count, 0);
  await Promise.all([grants.markServed(a, 6, { start: 3 }), grants.markServed(a, 6, { start: 3 })]);
  assert.equal((await sql`select measured_download_count from plugins where id=${rel.pluginId}`)[0].measured_download_count, 1);
  assert.equal((await sql`select bytes from download_events where grant_id=${g.grantId} and kind='served'`)[0].bytes, "10");
});

test("the download kill switch invalidates existing grants for HEAD and GET", async () => {
  const s = await session("ip-switch"), rel = await publishedRelease(991);
  const g = await grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rel.releaseId, ipHash: "ip-switch" });
  process.env.PLUGINS_DOWNLOADS_ENABLED = "false";
  try {
    for (const start of [true, false]) await assert.rejects(grants.authorizeFile({ grantId: g.grantId, sessionId: s.sessionId, ipHash: "ip-switch", start }), (e) => e.status === 503);
    await assert.rejects(grants.issueGrant({ sessionId: s.sessionId, userId: s.userId, releaseId: rel.releaseId, ipHash: "ip-switch" }), (e) => e.status === 503);
  } finally { delete process.env.PLUGINS_DOWNLOADS_ENABLED; }
});
