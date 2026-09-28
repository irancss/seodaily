// Security checks against a running server (no browser, no dependencies):
//   BASE_URL=http://127.0.0.1:3000 npm run test:security
// Read-only checks always run. Checks that log in or submit forms run only when
// ADMIN_EMAIL/ADMIN_PASSWORD (a disposable test admin) are given, so the suite
// can also be pointed at Production safely without them.
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { test } from "node:test";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const writes = ADMIN_EMAIL && ADMIN_PASSWORD ? {} : { skip: "needs ADMIN_EMAIL/ADMIN_PASSWORD of a test admin" };

const get = (path, init = {}) => fetch(BASE + path, { redirect: "manual", ...init });
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
// Unique per run, so the in-memory limiters do not carry over between runs.
const ip = () => `198.51.100.${Math.floor(Math.random() * 250) + 1}-${randomBytes(3).toString("hex")}`;

/** Posts a server-rendered form the way a browser without JavaScript does. */
async function postForm(path, fields, { cookie, headers = {}, formMarker } = {}) {
  const html = await (await get(path, { headers: cookie ? { cookie } : {} })).text();
  const scope = formMarker ? html.slice(html.indexOf(formMarker)) : html;
  const body = new FormData();
  for (const m of scope.matchAll(/<input type="hidden" name="(\$ACTION[^"]*)"(?: value="([^"]*)")?\/>/g)) {
    if (!body.has(m[1])) body.set(m[1], decode(m[2] ?? ""));
  }
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  return get(path, { method: "POST", body, headers: { Origin: BASE, ...(cookie ? { cookie } : {}), ...headers } });
}

async function login(headers = {}) {
  const res = await postForm("/admin/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, { headers });
  const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("sd_session="));
  return { res, setCookie, cookie: setCookie?.split(";")[0] };
}

const isAdmin = async (cookie) => (await get("/admin", { headers: { cookie } })).status === 200;

test("security headers on public and admin pages", async () => {
  for (const path of ["/", "/services/technical-seo", "/admin/login"]) {
    const res = await get(path);
    const h = (name) => res.headers.get(name) || "";
    const csp = h("content-security-policy");
    for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'", "form-action 'self'"]) {
      assert.ok(csp.includes(directive), `${path}: CSP has ${directive}`);
    }
    assert.doesNotMatch(csp, /unsafe-eval/, `${path}: no unsafe-eval in production`);
    assert.match(h("strict-transport-security"), /max-age=\d{7,}/, `${path}: HSTS`);
    assert.equal(h("x-content-type-options"), "nosniff");
    assert.equal(h("x-frame-options"), "SAMEORIGIN");
    assert.equal(h("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(h("x-powered-by"), "", `${path}: no X-Powered-By`);
  }
  const login = await get("/admin/login");
  assert.match(login.headers.get("cache-control") || "", /no-store/, "admin responses are not cached");
});

test("admin pages and data require a session", async () => {
  for (const path of ["/admin", "/admin/leads", "/admin/leads/1", "/admin/settings", "/admin/account", "/admin/leads/1/contract"]) {
    const res = await get(path);
    assert.ok([302, 303, 307].includes(res.status), `${path} → ${res.status}`);
    assert.match(res.headers.get("location") || "", /\/admin\/login$/);
  }
  const forged = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.invalid-signature";
  const res = await get("/admin/leads", { headers: { cookie: `sd_session=${forged}` } });
  assert.ok([302, 303, 307].includes(res.status), "a forged cookie is rejected");
});

test("a correctly signed token without a live session is rejected", { skip: SESSION_SECRET ? false : "needs SESSION_SECRET" }, async () => {
  // Pre-fix tokens carried only the user id; they must no longer grant access.
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  for (const payload of [{ sub: "1", iat: now, exp: now + 3600 }, { sub: "1", sid: "not-a-session", iat: now, exp: now + 3600 }]) {
    const unsigned = `${b64({ alg: "HS256" })}.${b64(payload)}`;
    const token = `${unsigned}.${createHmac("sha256", SESSION_SECRET).update(unsigned).digest("base64url")}`;
    const res = await get("/admin/leads", { headers: { cookie: `sd_session=${token}` } });
    assert.ok([302, 303, 307].includes(res.status), `${JSON.stringify(payload)} → ${res.status}`);
  }
});

test("server actions reject cross-origin posts (CSRF)", async () => {
  const res = await postForm(
    "/contact",
    { name: "تست امنیت", phone: "09120000000", service: "seo" },
    { headers: { Origin: "https://evil.example", "X-Real-IP": ip() }, formMarker: 'aria-labelledby="cf-title"' },
  );
  assert.notEqual(res.status, 200, "cross-origin action is refused");
  assert.doesNotMatch(await res.text(), /درخواست مشاوره ثبت شد/);
});

test("uploads only serve generated image names", async () => {
  // 404 from the app, or 400 when the reverse proxy already refuses a traversal.
  for (const path of ["/uploads/..%2F..%2Fetc%2Fpasswd", "/uploads/%2e%2e/package.json", "/uploads/a/b.png", "/uploads/x.svg", "/uploads/x.html", "/uploads/missing-file.png"]) {
    const res = await get(path);
    assert.ok([400, 404].includes(res.status), `${path} → ${res.status}`);
    assert.doesNotMatch(await res.text(), /root:|"name":\s*"seodaily"/, `${path}: no file content`);
  }
});

test("errors do not leak internals; malformed URLs are a 400, not a 500", async () => {
  for (const path of ["/%E0%A4%A", "/services/%ff", "/portfolio/%E0%A4%A"]) assert.equal((await get(path)).status, 400, path);
  for (const path of [`/no-such-${Date.now()}`, "/services/%E0%A4%A", "/portfolio/%ff"]) {
    const res = await get(path);
    const body = await res.text();
    assert.ok(res.status >= 400 && res.status < 500, `${path} → ${res.status}`);
    assert.doesNotMatch(body, /node_modules|\/app\/|at [\w.]+ \(|ECONNREFUSED|postgres:\/\/|SELECT |stack/i, `${path}: no internals`);
  }
});

test("login: cookie flags, and logout revokes the copied cookie", writes, async () => {
  const { res, setCookie, cookie } = await login({ "X-Forwarded-Proto": "https", "X-Real-IP": ip() });
  assert.equal(res.status, 303, "login redirects");
  assert.ok(setCookie, "session cookie set");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=lax/i);
  assert.match(setCookie, /Secure/i, "Secure over HTTPS");
  assert.match(setCookie, /Path=\//);
  assert.ok(await isAdmin(cookie), "session works");

  // A second browser stays logged in when the first one logs out.
  const other = await login({ "X-Real-IP": ip() });
  const logout = await postForm("/admin", {}, { cookie });
  assert.equal(logout.status, 303, "logout redirects");
  assert.equal(await isAdmin(cookie), false, "the logged-out cookie no longer works, even if copied");
  assert.ok(await isAdmin(other.cookie), "other sessions are untouched by a logout");
  await postForm("/admin", {}, { cookie: other.cookie });
});

test("login: wrong password is refused and repeated failures are braked", writes, async () => {
  const client = { "X-Real-IP": ip() };
  let res;
  for (let i = 0; i < 8; i++) {
    res = await postForm("/admin/login", { email: ADMIN_EMAIL, password: `wrong-${i}` }, { headers: client });
    assert.equal(res.headers.getSetCookie().length, 0, "no cookie for a wrong password");
    assert.match(await res.text(), /ایمیل یا رمز عبور نادرست است/);
  }
  res = await postForm("/admin/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, { headers: client });
  assert.match(await res.text(), /تعداد تلاش‌های ناموفق زیاد است/, "the right password is refused while braked");
  assert.equal(res.headers.getSetCookie().length, 0);
  // Another address is not affected by that brake.
  const ok = await login({ "X-Real-IP": ip() });
  assert.ok(ok.cookie, "another client can still log in");
  await postForm("/admin", {}, { cookie: ok.cookie });
});

test("lead forms: rate limit follows the proxy address, not a client-sent X-Forwarded-For", writes, async () => {
  const realIp = ip();
  const results = [];
  for (let i = 0; i < 6; i++) {
    const res = await postForm(
      "/contact",
      { name: "تست محدودیت", phone: "09120000000", service: "seo" },
      { headers: { "X-Forwarded-For": `10.66.${i}.1, ${realIp}`, "X-Real-IP": realIp }, formMarker: 'aria-labelledby="cf-title"' },
    );
    results.push(/تعداد درخواست‌ها زیاد است/.test(await res.text()) ? "limited" : "saved");
  }
  assert.deepEqual(results, ["saved", "saved", "saved", "saved", "saved", "limited"]);
});
