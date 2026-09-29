// Read-only inventory of public HTML, copy and internal links. Never submits forms.
// BASE_URL=https://seodaily.ir node scripts/seo-audit.mjs /tmp/seo-audit.json
import { writeFile } from "node:fs/promises";
import { parse } from "node-html-parser";

const base = new URL(process.env.BASE_URL || "http://127.0.0.1:3000");
const canonicalOrigin = new URL(process.env.SITE_ORIGIN || "https://seodaily.ir").origin;
const output = process.argv[2];
if (!output) throw new Error("Pass an output JSON file path");
const MAX_PAGES = 300;
const pages = new Map(), pending = new Set(["/", "/blog", "/plugins", "/portfolio"]);
const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
const pagePath = (url) => `${url.pathname}${url.search}`;
const isPage = (url) => !/^\/(admin|api|uploads|_next)(\/|$)/.test(url.pathname)
  && !/\/download(?:\/|$)/.test(url.pathname) && !/\.[a-z0-9]{2,5}$/i.test(url.pathname)
  && [...url.searchParams.keys()].every((key) => key === "page");
function internal(href, source) {
  try {
    const url = new URL(href, new URL(source, base));
    if (![base.origin, canonicalOrigin].includes(url.origin) || !isPage(url)) return null;
    return url;
  } catch { return null; }
}
async function get(path) {
  try {
    const started = performance.now();
    const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(20000) });
    const html = await response.text();
    return { response, html, ms: Math.round(performance.now() - started) };
  } catch (error) { return { error: error.message }; }
}
const sitemap = await get("/sitemap.xml"), robots = await get("/robots.txt");
const sitemapPaths = sitemap.html ? parse(sitemap.html).querySelectorAll("loc").map((node) => pagePath(new URL(node.text))) : [];
for (const path of sitemapPaths) pending.add(path);
while (pending.size && pages.size < MAX_PAGES) {
  const batch = [...pending].slice(0, 2);
  batch.forEach((path) => pending.delete(path));
  await Promise.all(batch.map(async (path) => {
    const result = await get(path);
    if (result.error) { pages.set(path, { path, error: result.error, links: [] }); return; }
    const { response, html, ms } = result, dom = parse(html);
    const main = dom.querySelector("main") || dom;
    const meta = (name) => dom.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || "";
    const structuredData = dom.querySelectorAll('script[type="application/ld+json"]').map((node) => {
      try { return JSON.parse(node.text); } catch { return { error: "Invalid JSON-LD" }; }
    });
    const links = dom.querySelectorAll("a[href]").map((node) => {
      const href = node.getAttribute("href"), target = internal(href, path);
      const inMain = !!node.closest("main"), navigation = !!node.closest("nav");
      return { href, text: clean(node.getAttribute("aria-label")) || clean(node.text) || clean(node.querySelector("img")?.getAttribute("alt")),
        hidden: !!node.closest('[aria-hidden="true"]'),
        target: target ? pagePath(target) : null, hash: target?.hash || "", rel: node.getAttribute("rel") || "",
        area: !inMain ? "template" : navigation ? "navigation" : "content", contextual: inMain && !navigation && !!node.closest("p") };
    });
    const headings = main.querySelectorAll("h1,h2,h3,h4,h5,h6").map((node) => ({ level: Number(node.rawTagName.slice(1)), text: clean(node.text) }));
    const title = clean(dom.querySelector("title")?.text), description = meta("description");
    const row = { path, status: response.status, location: response.headers.get("location"), ms, title, description,
      canonical: dom.querySelector('link[rel="canonical"]')?.getAttribute("href") || "", robots: meta("robots"),
      lang: dom.querySelector("html")?.getAttribute("lang"), dir: dom.querySelector("html")?.getAttribute("dir"), h1: headings.filter((h) => h.level === 1).map((h) => h.text), headings,
      ids: dom.querySelectorAll("[id]").map((node) => node.getAttribute("id")),
      missingAlt: main.querySelectorAll("img").filter((node) => !node.hasAttribute("alt")).map((node) => node.getAttribute("src")),
      paragraphs: main.querySelectorAll("p,li").filter((node) => !node.closest("nav")).map((node) => clean(node.text)).filter(Boolean), links, structuredData };
    pages.set(path, row);
    for (const link of links) if (link.target && !pages.has(link.target)) pending.add(link.target);
    const redirect = row.location && internal(row.location, path);
    if (redirect && !pages.has(pagePath(redirect))) pending.add(pagePath(redirect));
  }));
  // Avoid revisiting a page queued by the other request in this batch.
  for (const path of pages.keys()) pending.delete(path);
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const rows = [...pages.values()].sort((a, b) => a.path.localeCompare(b.path));
const errors = [], notes = [];
for (const [path, result] of [["/sitemap.xml", sitemap], ["/robots.txt", robots]]) {
  if (result.response?.status !== 200) errors.push({ path, problem: result.error || `HTTP ${result.response?.status}` });
}
if (!sitemapPaths.length) errors.push({ path: "/sitemap.xml", problem: "No public URLs in sitemap" });
for (const page of rows) {
  if (page.error || page.status >= 400) errors.push({ path: page.path, problem: page.error || `HTTP ${page.status}` });
  if (page.status !== 200) continue;
  if (page.h1.length !== 1) errors.push({ path: page.path, problem: `H1 count ${page.h1.length}` });
  if (!page.title || !page.description || !page.canonical) errors.push({ path: page.path, problem: "Missing title, description or canonical" });
  if (!/^fa/.test(page.lang || "") || page.dir !== "rtl") errors.push({ path: page.path, problem: "Missing Persian language or RTL direction" });
  if (page.structuredData.some((item) => item?.error === "Invalid JSON-LD")) errors.push({ path: page.path, problem: "Invalid JSON-LD" });
  if (page.missingAlt.length) errors.push({ path: page.path, problem: "Image without alt attribute", images: page.missingAlt });
  if (sitemapPaths.includes(page.path) && /noindex/.test(page.robots)) errors.push({ path: page.path, problem: "Noindex URL in sitemap" });
  for (const link of page.links) {
    if (!link.target) continue;
    const target = pages.get(link.target);
    if (target && (target.error || target.status >= 400)) errors.push({ path: page.path, problem: "Broken internal link", href: link.href, text: link.text });
    if (target?.status >= 300 && target.status < 400) notes.push({ path: page.path, problem: "Internal link redirects", href: link.href });
    if (!link.text && !link.hidden) errors.push({ path: page.path, problem: "Internal link without accessible text", href: link.href });
    if (target?.status === 200 && link.hash) {
      let id; try { id = decodeURIComponent(link.hash.slice(1)); } catch { id = ""; }
      if (!target.ids.includes(id)) errors.push({ path: page.path, problem: "Missing fragment target", href: link.href });
    }
  }
  page.incomingContent = rows.flatMap((source) => source.path === page.path ? [] : source.links.filter((link) => link.target === page.path && link.area === "content").map((link) => ({ from: source.path, text: link.text, contextual: link.contextual })));
  if (!page.incomingContent.length && !/noindex/.test(page.robots) && page.path !== "/") notes.push({ path: page.path, problem: "No incoming content link" });
}
for (const key of ["title", "description"]) {
  const groups = new Map();
  for (const row of rows.filter((page) => page.status === 200 && !/noindex/.test(page.robots))) if (row[key]) groups.set(row[key], [...(groups.get(row[key]) || []), row.path]);
  for (const [value, paths] of groups) if (paths.length > 1) notes.push({ problem: `Duplicate ${key}`, value, paths });
}
const report = { at: new Date().toISOString(), base: base.origin, canonicalOrigin, complete: !pending.size,
  sitemap: { status: sitemap.response?.status, paths: sitemapPaths }, robots: { status: robots.response?.status, text: robots.html },
  counts: { pages: rows.length, sitemap: sitemapPaths.length, internalLinks: rows.reduce((n, p) => n + p.links.filter((l) => l.target).length, 0), contextualLinks: rows.reduce((n, p) => n + p.links.filter((l) => l.contextual && l.target).length, 0), errors: errors.length, notes: notes.length }, errors, notes, pages: rows };
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ output, complete: report.complete, counts: report.counts, errors, notes }, null, 2));
if (process.env.AUDIT_STRICT === "true" && (errors.length || pending.size)) process.exitCode = 1;
