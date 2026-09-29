import { parse, type HTMLElement } from "node-html-parser";

import { FetchError, fetchText } from "./safe-fetch";
import { cleanVersion, compareVersions, parseVersion } from "./versions";

// Source adapters: read the version a source announces and where its file is.
// Order of trust: official API/structured data, then a domain adapter, then
// generic signals on the page. Low confidence or several plausible files is
// MANUAL_SETUP_REQUIRED — the first or an advertised file is never guessed.
// Page text is data only; nothing in it is followed as an instruction.

export type SourceConfig = {
  url: string;
  adapter: string;
  versionSelector: string;
  versionAttribute: string;
  versionRegex: string;
  downloadSelector: string;
  downloadUrl: string;
  allowPrerelease: boolean;
  etag?: string;
  lastModified?: string;
};

export type Observation = {
  result: "ok" | "not_modified" | "manual_setup_required" | "error";
  adapter: string;
  version: string;
  downloadUrl: string;
  confidence: number;
  evidence: string[];
  error: string;
  changelog: string;
  iconUrl: string;
  /** Official per-file checksums endpoint for this exact version (WordPress.org only). */
  checksumsUrl: string;
  meta: { requiresWp?: string; requiresPhp?: string; testedUpTo?: string; author?: string; homepage?: string };
  etag: string;
  lastModified: string;
  retryAfterMs: number;
};

export type FetchLike = typeof fetchText;
export type AdapterEnv = { fetchText: FetchLike; timeoutMs: number; maxHtmlBytes: number; userAgent: string };

function blank(adapter: string): Observation {
  return {
    result: "error",
    adapter,
    version: "",
    downloadUrl: "",
    confidence: 0,
    evidence: [],
    error: "",
    changelog: "",
    iconUrl: "",
    checksumsUrl: "",
    meta: {},
    etag: "",
    lastModified: "",
    retryAfterMs: 0,
  };
}

const htmlToText = (html: string) =>
  parse(`<div>${html}</div>`)
    .textContent.replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export function detectAdapter(url: string, configured: string): string {
  if (configured && configured !== "auto") return configured;
  try {
    const u = new URL(url);
    if (/^(www\.)?wordpress\.org$/i.test(u.hostname) && /^\/plugins\/[^/]+/.test(u.pathname)) return "wordpress_org";
    if (/^(www\.)?github\.com$/i.test(u.hostname) && /^\/[^/]+\/[^/]+/.test(u.pathname)) return "github";
  } catch {
    /* invalid URL: the fetch reports it */
  }
  return "html";
}

// ---- WordPress.org (official API + checksums) ----

async function wordpressOrg(cfg: SourceConfig, env: AdapterEnv): Promise<Observation> {
  const o = blank("wordpress_org");
  const slug = /\/plugins\/([a-z0-9-]+)/i.exec(new URL(cfg.url).pathname)?.[1];
  if (!slug) return { ...o, result: "manual_setup_required", error: "نامک افزونه در نشانی WordPress.org پیدا نشد." };
  const api = `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${encodeURIComponent(slug)}&request[fields][icons]=1&request[fields][sections]=1&request[fields][versions]=0`;
  const res = await env.fetchText(api, { timeoutMs: env.timeoutMs, maxBytes: env.maxHtmlBytes, userAgent: env.userAgent, accept: "application/json" });
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(res.text);
  } catch {
    return { ...o, error: "پاسخ API وردپرس JSON معتبر نبود." };
  }
  if (data.error) return { ...o, error: `API وردپرس: ${String(data.error).slice(0, 200)}` };
  const version = cleanVersion(String(data.version ?? ""));
  const download = String(data.download_link ?? "");
  if (!parseVersion(version) || !download) return { ...o, result: "manual_setup_required", error: "API وردپرس نسخه یا لینک دانلود معتبر نداد." };
  const icons = (data.icons ?? {}) as Record<string, string>;
  const sections = (data.sections ?? {}) as Record<string, string>;
  let changelog = "";
  if (sections.changelog) {
    const text = htmlToText(sections.changelog);
    const i = text.indexOf(version);
    changelog = (i >= 0 ? text.slice(i + version.length) : text).split(/\n\s*\d+\.\d+[\d.]*\s*\n/)[0].trim().slice(0, 3000);
  }
  return {
    ...o,
    result: "ok",
    version,
    downloadUrl: download,
    confidence: 100,
    evidence: ["API رسمی WordPress.org (plugin_information)"],
    changelog,
    iconUrl: icons["2x"] || icons["1x"] || "",
    checksumsUrl: `https://downloads.wordpress.org/plugin-checksums/${encodeURIComponent(slug)}/${encodeURIComponent(version)}.json`,
    meta: {
      requiresWp: String(data.requires ?? "") || undefined,
      requiresPhp: String(data.requires_php ?? "") || undefined,
      testedUpTo: String(data.tested ?? "") || undefined,
      author: data.author ? htmlToText(String(data.author)).slice(0, 200) : undefined,
      homepage: String(data.homepage ?? "") || undefined,
    },
  };
}

// ---- GitHub releases (a packaged .zip asset, never the source zipball) ----

async function github(cfg: SourceConfig, env: AdapterEnv): Promise<Observation> {
  const o = blank("github");
  const [, owner, repo] = new URL(cfg.url).pathname.split("/");
  const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=10`;
  const res = await env.fetchText(api, { timeoutMs: env.timeoutMs, maxBytes: env.maxHtmlBytes, userAgent: env.userAgent, accept: "application/vnd.github+json" });
  let list: { tag_name?: string; prerelease?: boolean; draft?: boolean; body?: string; assets?: { name: string; browser_download_url: string }[] }[];
  try {
    list = JSON.parse(res.text);
  } catch {
    return { ...o, error: "پاسخ GitHub JSON معتبر نبود." };
  }
  if (!Array.isArray(list)) return { ...o, error: "GitHub فهرست انتشار نداد." };
  const usable = list
    .filter((r) => !r.draft && (cfg.allowPrerelease || !r.prerelease))
    .map((r) => ({ r, version: cleanVersion(String(r.tag_name ?? "")) }))
    .filter((x) => parseVersion(x.version))
    .sort((a, b) => compareVersions(b.version, a.version) ?? 0);
  const top = usable[0];
  if (!top) return { ...o, result: "manual_setup_required", error: "انتشار قابل‌مقایسه‌ای در GitHub پیدا نشد." };
  const zips = (top.r.assets ?? []).filter((a) => /\.zip$/i.test(a.name));
  if (zips.length !== 1) {
    return { ...o, result: "manual_setup_required", version: top.version, error: zips.length ? "چند فایل ZIP در انتشار GitHub هست؛ لینک دانلود را دستی تنظیم کنید." : "انتشار GitHub فایل ZIP بسته‌بندی‌شده ندارد." };
  }
  return {
    ...o,
    result: "ok",
    version: top.version,
    downloadUrl: zips[0].browser_download_url,
    confidence: 90,
    evidence: [`GitHub release ${top.r.tag_name}`, `asset: ${zips[0].name}`],
    changelog: String(top.r.body ?? "").slice(0, 3000),
  };
}

// ---- Generic page: manual selectors first, then signals ----

const VERSION_TEXT = /(?:version|ver\.|نسخه|ورژن)\s*[:：]?\s*v?([0-9۰-۹٠-٩]{1,4}(?:[.][0-9۰-۹٠-٩]{1,4}){1,3}(?:[-.]?(?:beta|rc|alpha)[-.]?\d{0,3})?)/gi;

function visibleText(root: HTMLElement) {
  root.querySelectorAll("script,style,noscript,template,svg").forEach((n) => n.remove());
  return root.textContent.replace(/\s+/g, " ").slice(0, 400_000);
}

function applyRegex(text: string, pattern: string): string {
  if (!pattern) return text;
  if (pattern.length > 200) throw new Error("regex نسخه بیش از حد طولانی است.");
  const m = new RegExp(pattern, "i").exec(text.slice(0, 20_000));
  return m ? (m[1] ?? m[0]) : "";
}

type Candidate = { url: string; score: number; why: string[] };

function downloadCandidates(root: HTMLElement, base: string, version: string): Candidate[] {
  const out = new Map<string, Candidate>();
  for (const a of root.querySelectorAll("a[href]").slice(0, 3000)) {
    const href = a.getAttribute("href") ?? "";
    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const text = `${a.textContent} ${a.getAttribute("title") ?? ""} ${a.getAttribute("download") ?? ""}`.replace(/\s+/g, " ").trim().toLowerCase();
    const path = decodeURIComponent(url.pathname).toLowerCase();
    let score = 0;
    const why: string[] = [];
    if (/\.zip$/.test(path)) {
      score += 45;
      why.push("پسوند zip");
    }
    if (/(download|دانلود|دریافت)/.test(text)) {
      score += 20;
      why.push("متن دانلود");
    }
    if (/(download|dl\b|file)/.test(url.hostname + path)) {
      score += 5;
      why.push("مسیر دانلود");
    }
    if (version && (path.includes(version) || text.includes(version))) {
      score += 30;
      why.push("شامل نسخه");
    }
    if (/(demo|preview|theme|قالب|banner|ads|تبلیغ|telegram|instagram|whatsapp|login|register|cart|checkout|pricing)/.test(text + path)) {
      score -= 60;
      why.push("نشانه لینک غیرفایل");
    }
    if (score <= 0) continue;
    const key = url.href;
    const prev = out.get(key);
    if (!prev || prev.score < score) out.set(key, { url: key, score, why });
  }
  return [...out.values()].sort((a, b) => b.score - a.score);
}

async function htmlPage(cfg: SourceConfig, env: AdapterEnv): Promise<Observation> {
  const o = blank("html");
  const res = await env.fetchText(cfg.url, {
    timeoutMs: env.timeoutMs,
    maxBytes: env.maxHtmlBytes,
    userAgent: env.userAgent,
    etag: cfg.etag,
    lastModified: cfg.lastModified,
    accept: "text/html,application/xhtml+xml",
  });
  const base = { ...o, etag: res.etag, lastModified: res.lastModified };
  if (res.notModified) return { ...base, result: "not_modified", evidence: ["صفحه تغییری نکرده است (304)"] };
  if (!/html|xml|text\/plain/i.test(res.contentType) && res.contentType) {
    return { ...base, result: "manual_setup_required", error: `نوع محتوای صفحه (${res.contentType.slice(0, 60)}) HTML نیست؛ اگر لینک مستقیم فایل است نوع منبع را «لینک مستقیم» بگذارید.` };
  }
  const root = parse(res.text, { comment: false });
  if (/(captcha|cf-challenge|challenge-platform|g-recaptcha)/i.test(res.text.slice(0, 50_000)) && res.text.length < 60_000) {
    return { ...base, result: "manual_setup_required", error: "صفحه منبع CAPTCHA/چالش دارد؛ دور زده نمی‌شود. لینک مستقیم مجاز را تنظیم کنید." };
  }
  const evidence: string[] = [];

  // Version
  let version = "";
  let confidence = 0;
  if (cfg.versionSelector) {
    const el = root.querySelector(cfg.versionSelector);
    if (!el) return { ...base, result: "manual_setup_required", error: `selector نسخه («${cfg.versionSelector.slice(0, 80)}») در صفحه پیدا نشد؛ ساختار صفحه عوض شده است.` };
    const raw = cfg.versionAttribute ? (el.getAttribute(cfg.versionAttribute) ?? "") : el.textContent;
    version = cleanVersion(applyRegex(raw.trim(), cfg.versionRegex));
    const m = parseVersion(version) ? null : VERSION_TEXT.exec(raw);
    VERSION_TEXT.lastIndex = 0;
    if (m) version = cleanVersion(m[1]);
    confidence = 95;
    evidence.push(`selector دستی نسخه: ${cfg.versionSelector.slice(0, 80)}`);
  } else {
    const found = new Map<string, { n: number; score: number; why: string }>();
    const add = (v: string, score: number, why: string) => {
      const clean = cleanVersion(v);
      if (!parseVersion(clean)) return;
      const cur = found.get(clean) ?? { n: 0, score: 0, why };
      cur.n++;
      if (score > cur.score) {
        cur.score = score;
        cur.why = why;
      }
      found.set(clean, cur);
    };
    for (const s of root.querySelectorAll('script[type="application/ld+json"]').slice(0, 10)) {
      const m = /"softwareVersion"\s*:\s*"([^"]{1,40})"/.exec(s.textContent);
      if (m) add(m[1], 90, "JSON-LD softwareVersion");
    }
    for (const m of root.querySelectorAll('[itemprop="softwareVersion"]').slice(0, 5)) add(m.getAttribute("content") ?? m.textContent, 85, "itemprop softwareVersion");
    const text = visibleText(root);
    if (cfg.versionRegex) {
      const v = applyRegex(text, cfg.versionRegex);
      if (v) add(v, 90, "regex دستی نسخه");
    }
    for (const m of text.matchAll(VERSION_TEXT)) add(m[1], 60, "برچسب «نسخه/Version» در متن صفحه");
    const ranked = [...found.entries()].map(([v, x]) => ({ v, ...x, total: x.score + Math.min(20, (x.n - 1) * 10) })).sort((a, b) => b.total - a.total);
    if (ranked.length === 0) return { ...base, result: "manual_setup_required", error: "نسخه‌ای در صفحه پیدا نشد؛ selector یا regex نسخه را تنظیم کنید." };
    if (ranked.length > 1 && ranked[1].total >= ranked[0].total - 5 && ranked[1].v !== ranked[0].v) {
      return {
        ...base,
        result: "manual_setup_required",
        evidence: ranked.slice(0, 4).map((r) => `${r.v} (${r.why}، ${r.n} بار)`),
        error: "چند نسخه با شواهد نزدیک در صفحه هست؛ selector نسخه را تنظیم کنید.",
      };
    }
    version = ranked[0].v;
    confidence = Math.min(95, ranked[0].total);
    evidence.push(`${ranked[0].why} (${ranked[0].n} بار)`);
  }
  if (!parseVersion(version)) return { ...base, result: "manual_setup_required", evidence, error: `متن «${version.slice(0, 40)}» نسخه قابل مقایسه نیست.` };

  // Download link
  let downloadUrl = "";
  if (cfg.downloadUrl) {
    downloadUrl = cfg.downloadUrl.replace(/\{version\}/g, encodeURIComponent(version));
    evidence.push("لینک دانلود دستی");
  } else if (cfg.downloadSelector) {
    const el = root.querySelector(cfg.downloadSelector);
    const href = el?.getAttribute("href") ?? el?.getAttribute("data-href") ?? el?.getAttribute("data-url") ?? "";
    if (!href) return { ...base, result: "manual_setup_required", version, evidence, error: `selector دانلود («${cfg.downloadSelector.slice(0, 80)}») لینکی پیدا نکرد.` };
    downloadUrl = new URL(href, res.url).href;
    evidence.push(`selector دستی دانلود: ${cfg.downloadSelector.slice(0, 80)}`);
  } else {
    const c = downloadCandidates(root, res.url, version);
    if (c.length === 0 || c[0].score < 50) {
      return { ...base, result: "manual_setup_required", version, confidence, evidence, error: "لینک دانلود مطمئنی پیدا نشد؛ selector یا لینک مستقیم را تنظیم کنید." };
    }
    if (c.length > 1 && c[1].score >= c[0].score - 10) {
      return {
        ...base,
        result: "manual_setup_required",
        version,
        confidence,
        evidence: [...evidence, ...c.slice(0, 3).map((x) => `کاندید: ${x.url.slice(0, 120)} (${x.score})`)],
        error: "چند فایل با احتمال نزدیک پیدا شد؛ برای جلوگیری از حدس، لینک یا selector دانلود را تنظیم کنید.",
      };
    }
    downloadUrl = c[0].url;
    confidence = Math.min(confidence, c[0].score + 30);
    evidence.push(`لینک دانلود: ${c[0].why.join("، ")}`);
  }
  if (confidence < 60) return { ...base, result: "manual_setup_required", version, downloadUrl, confidence, evidence, error: "اطمینان تشخیص کم است؛ تنظیم دستی لازم است." };
  return { ...base, result: "ok", version, downloadUrl, confidence, evidence };
}

// ---- Direct file URL: the version is read from the package itself ----

function direct(cfg: SourceConfig): Observation {
  const o = blank("direct");
  const url = cfg.downloadUrl || cfg.url;
  return { ...o, result: "ok", version: "", downloadUrl: url, confidence: 70, evidence: ["لینک مستقیم فایل؛ نسخه از سرآیند بسته خوانده می‌شود"] };
}

/** Reads one source. Network/parse failures come back as an observation, never thrown. */
export async function observeSource(cfg: SourceConfig, env: AdapterEnv): Promise<Observation> {
  const adapter = detectAdapter(cfg.url, cfg.adapter);
  try {
    if (adapter === "wordpress_org") return await wordpressOrg(cfg, env);
    if (adapter === "github") return await github(cfg, env);
    if (adapter === "direct") return direct(cfg);
    return await htmlPage(cfg, env);
  } catch (error) {
    const o = blank(adapter);
    if (error instanceof FetchError) return { ...o, error: error.message, retryAfterMs: error.retryAfterMs };
    return { ...o, error: `خطای پردازش منبع: ${(error as Error).message.slice(0, 200)}` };
  }
}
