// Prints a crawl table of every sitemap page (plus /portfolio and a 404) as Markdown.
//   BASE_URL=https://seodaily.ir node tests/seo-report.mjs >> "$GITHUB_STEP_SUMMARY"
// Read-only: one GET per page.
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const attr = (html, re) => html.match(re)?.[1] ?? "";
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const cell = (s) => String(s).replace(/\|/g, "\\|");

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(decode(m[1])).pathname);
if (!paths.includes("/portfolio")) paths.push("/portfolio");
paths.push(`/no-such-page-${Date.now().toString(36)}`);

console.log(`### SEO crawl — ${BASE} (${new Date().toISOString()})\n`);
console.log("| Path | Status | Canonical | Robots | H1 | Title | Desc | JSON-LD |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const path of paths) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  const html = await res.text();
  const types = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap((m) => {
      try {
        return [JSON.parse(m[1])].flat().map((item) => item["@type"]);
      } catch {
        return ["INVALID"];
      }
    });
  const row = [
    path,
    res.status,
    attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/),
    attr(html, /<meta name="robots" content="([^"]*)"/) || "index",
    (html.match(/<h1[\s>]/g) || []).length,
    decode(attr(html, /<title>([^<]*)<\/title>/)),
    decode(attr(html, /<meta name="description" content="([^"]*)"/)).length,
    types.join(", "),
  ];
  console.log(`| ${row.map(cell).join(" | ")} |`);
}
