// SEO checks against a running server (no browser, no dependencies):
//   BASE_URL=http://127.0.0.1:3000 SITE_ORIGIN=https://seodaily.ir npm run test:seo
// BASE_URL is where the app answers; SITE_ORIGIN is the canonical origin the
// app is configured with (SITE_URL). URLs found in the sitemap are fetched
// from BASE_URL with the same path.
import assert from "node:assert/strict";
import { test } from "node:test";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ORIGIN = (process.env.SITE_ORIGIN || "https://seodaily.ir").replace(/\/+$/, "");
const IMPORTANT = ["/", "/web-design", "/seo", "/services", "/pricing", "/about", "/contact", "/services/technical-seo", "/services/seo-audit"];

const get = (path, init) => fetch(BASE + path, { redirect: "manual", ...init });
const local = (url) => url.replace(ORIGIN, BASE);
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** The SEO-relevant bits of an HTML document (server-rendered HTML, as crawlers first see it). */
function inspect(html) {
  const meta = (name) => html.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`))?.[1];
  return {
    title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""),
    description: decode(meta("description") ?? ""),
    robots: meta("robots") ?? "",
    canonical: decode(html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/)?.[1] ?? ""),
    h1: (html.match(/<h1[\s>]/g) || []).length,
    lang: html.match(/<html[^>]+lang="([^"]+)"/)?.[1],
    dir: html.match(/<html[^>]+dir="([^"]+)"/)?.[1],
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
  };
}

async function page(path) {
  const res = await get(path);
  const html = res.status === 200 ? await res.text() : "";
  return { res, html, ...inspect(html) };
}

let sitemapUrls = [];

test("robots.txt: crawlable site, admin disallowed, sitemap listed, no Host line", async () => {
  const res = await get("/robots.txt");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /text\/plain/);
  const body = await res.text();
  assert.match(body, /^User-Agent: \*$/im);
  assert.match(body, /^Disallow: \/admin$/m);
  assert.doesNotMatch(body, /^Disallow: \/$/m, "the whole site must not be blocked");
  assert.doesNotMatch(body, /^Host:/im, "Google ignores Host; it should not be emitted");
  assert.match(body, new RegExp(`^Sitemap: ${ORIGIN}/sitemap\\.xml$`, "m"));
  for (const asset of ["/_next", "/fonts", "/uploads"]) assert.doesNotMatch(body, new RegExp(`^Disallow: ${asset}`, "m"));
});

test("sitemap.xml: valid UTF-8 XML with unique canonical https URLs, no admin", async () => {
  const res = await get("/sitemap.xml");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /xml/);
  const xml = await res.text();
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.equal((xml.match(/<url>/g) || []).length, (xml.match(/<\/url>/g) || []).length);
  sitemapUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  assert.ok(sitemapUrls.length >= 10, "sitemap lists the public pages and services");
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "no duplicate URLs");
  for (const url of sitemapUrls) {
    assert.ok(url === ORIGIN || url.startsWith(`${ORIGIN}/`), `${url} uses ${ORIGIN}`);
    assert.doesNotMatch(url, /\/admin|\/api\/|[?#]/, `${url} is a public canonical URL`);
  }
  assert.doesNotMatch(xml, /<changefreq>|<priority>/, "no made-up changefreq/priority");
});

test("sitemap URLs answer 200, are indexable and self-canonical", async () => {
  if (sitemapUrls.length === 0) {
    const xml = await (await get("/sitemap.xml")).text();
    sitemapUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  }
  for (const url of sitemapUrls) {
    const res = await fetch(local(url), { redirect: "manual" });
    assert.equal(res.status, 200, `${url} → ${res.status}`);
    const p = inspect(await res.text());
    assert.doesNotMatch(p.robots, /noindex/, `${url} must not be noindex`);
    assert.doesNotMatch(res.headers.get("x-robots-tag") || "", /noindex/, `${url} X-Robots-Tag`);
    assert.equal(p.canonical, url, `${url} canonical`);
  }
});

test("important pages: 200, title, description, one H1, canonical, lang/dir", async () => {
  const titles = new Map();
  const descriptions = new Map();
  for (const path of IMPORTANT) {
    const p = await page(path);
    assert.equal(p.res.status, 200, `${path} status`);
    assert.ok(p.title.length >= 10, `${path} has a title`);
    assert.ok(p.description.length >= 50, `${path} has a description`);
    assert.equal(p.h1, 1, `${path} has exactly one H1`);
    assert.equal(p.canonical, path === "/" ? ORIGIN : `${ORIGIN}${path}`, `${path} canonical`);
    assert.doesNotMatch(p.robots, /noindex/, `${path} indexable`);
    assert.match(p.lang ?? "", /^fa/);
    assert.equal(p.dir, "rtl");
    assert.ok(!titles.has(p.title), `${path} title duplicates ${titles.get(p.title)}`);
    assert.ok(!descriptions.has(p.description), `${path} description duplicates ${descriptions.get(p.description)}`);
    titles.set(p.title, path);
    descriptions.set(p.description, path);
  }
});

test("structured data is valid JSON-LD and has no ratings or reviews", async () => {
  for (const path of IMPORTANT) {
    const p = await page(path);
    assert.ok(p.jsonLd.length > 0, `${path} has JSON-LD`);
    for (const block of p.jsonLd) {
      const data = JSON.parse(block);
      const text = JSON.stringify(data);
      assert.doesNotMatch(text, /aggregateRating|"review"/i, `${path}: no ratings/reviews`);
      for (const item of Array.isArray(data) ? data : [data]) assert.equal(item["@context"], "https://schema.org");
    }
  }
});

test("unknown URL: real 404 with noindex (no soft 404)", async () => {
  const path = `/no-such-page-${Date.now().toString(36)}`;
  const res = await get(path);
  assert.equal(res.status, 404);
  const p = inspect(await res.text());
  assert.match(p.robots, /noindex/);
  assert.ok(!sitemapUrls.some((u) => u.endsWith(path)));
  assert.equal((await get("/services/no-such-service")).status, 404);
});

test("trailing slash redirects permanently to the canonical path", async () => {
  const res = await get("/seo/");
  assert.ok([301, 308].includes(res.status), `status ${res.status}`);
  assert.match(res.headers.get("location") || "", /\/seo$/);
});

test("admin is protected and noindex", async () => {
  const panel = await get("/admin");
  assert.ok([302, 303, 307].includes(panel.status), "admin redirects to login");
  assert.match(panel.headers.get("location") || "", /\/admin\/login$/);
  const login = await get("/admin/login");
  assert.equal(login.status, 200);
  assert.match(login.headers.get("x-robots-tag") || "", /noindex/);
  assert.match(inspect(await login.text()).robots, /noindex/);
});

test("decorative UI text does not leak into the page text", async () => {
  for (const path of IMPORTANT) {
    const html = (await page(path)).html;
    assert.doesNotMatch(html, /your-business\.ir|your-brand\.ir|search\?q=|>Fax</, `${path}: mockup/honeypot text`);
    assert.doesNotMatch(html, /٪٪|%%/, `${path}: doubled percent sign`);
  }
});
