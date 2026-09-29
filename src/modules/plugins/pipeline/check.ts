import { and, asc, eq, ne, sql } from "drizzle-orm";
import { readFile, rm, stat } from "node:fs/promises";

import { db, schema } from "@/db";
import type { PluginHeader, ReleaseCheck, ReleaseChecks } from "@/db/plugins-schema";
import { deleteImage, MAX_UPLOAD_BYTES, saveImage } from "@/modules/uploads/storage";

import { observeSource, type AdapterEnv, type Observation, type SourceConfig } from "./adapters";
import type { PipelineConfig } from "./config";
import { gateBlockers, hardFailure, publishRelease } from "./releases";
import { FetchError, fetchText as realFetchText, fetchToFile as realFetchToFile, redactUrl } from "./safe-fetch";
import type { SandboxRunner } from "./sandbox";
import { commitObject, freeBytes, objectPath, tempPath } from "./storage";
import { cleanVersion, compareVersions, isNewer, isPrerelease, parseVersion } from "./versions";
import { inspectPackage, ZipError, type PackageReport } from "./zip";

// One plugin's check: read every enabled source (a low-priority source may
// be newer), pick the newest comparable version, fetch and verify its
// package into private storage, record the checks, and publish only when the
// gate is fully green. The current release is untouched by any failure.

const { plugins, pluginSources, pluginSourceObservations, pluginReleases } = schema;

export type CheckContext = {
  cfg: PipelineConfig;
  fetchText?: typeof realFetchText;
  fetchToFile?: typeof realFetchToFile;
  scan: (file: string, sha256: string) => Promise<ReleaseCheck>;
  sandbox: SandboxRunner;
  log: (line: string) => void;
  /** False when this worker lost the job (lease taken over) or it was cancelled: stop before any publish. */
  stillOwned: () => Promise<boolean>;
  invalidate: () => Promise<void>;
  /** Pause between requests to one host (politeness). */
  hostDelayMs?: number;
};

export type CheckOutcome = {
  status: "updated" | "up_to_date" | "review" | "partial" | "failed" | "manual_setup_required" | "no_sources" | "cancelled";
  sources: { id: number; result: string; version: string; error: string }[];
  published?: { releaseId: number; version: string };
  review: { releaseId: number; version: string; reasons: string[] }[];
  rejected: { version: string; reason: string }[];
  notes: string[];
};

type Candidate = { source: typeof pluginSources.$inferSelect; obs: Observation };

export async function officialChecksums(url: string, report: PackageReport, ctx: CheckContext, fetchText: typeof realFetchText): Promise<ReleaseCheck> {
  const at = new Date().toISOString();
  if (!url) return { status: "UNAVAILABLE", detail: "برای این بسته مرجع checksum رسمی وجود ندارد (این «تأیید اصالت» نیست).", at };
  try {
    const res = await fetchText(url, { timeoutMs: ctx.cfg.fetchTimeoutMs, maxBytes: 8 * 1024 * 1024, userAgent: ctx.cfg.userAgent, accept: "application/json" });
    const files = (JSON.parse(res.text)?.files ?? {}) as Record<string, { sha256?: string | string[] }>;
    const names = Object.keys(files);
    if (names.length === 0) return { required: true, status: "UNAVAILABLE", detail: "فایل checksum رسمی خالی بود.", at };
    const mismatched: string[] = [];
    const missing: string[] = [];
    for (const name of names) {
      const expected = files[name].sha256;
      const list = Array.isArray(expected) ? expected : expected ? [expected] : [];
      const actual = report.fileHashes[name];
      if (!actual) missing.push(name);
      else if (!list.length || !list.includes(actual)) mismatched.push(name);
    }
    const extra = Object.keys(report.fileHashes).filter((n) => !files[n]);
    if (mismatched.length || missing.length || extra.length) {
      return { status: "FAIL", detail: `با checksum رسمی WordPress.org نمی‌خواند: ${[...mismatched, ...missing, ...extra].slice(0, 8).join("، ")}`, at };
    }
    return { status: "PASS", detail: `${names.length} فایل با checksum رسمی WordPress.org برابر است${extra.length ? `؛ ${extra.length} فایل اضافه بیرون از مرجع` : ""}.`, at };
  } catch (error) {
    if (error instanceof FetchError && error.status === 404) return { status: "UNAVAILABLE", detail: "مرجع checksum برای این نسخه منتشر نشده است.", at };
    return { required: true, status: "UNAVAILABLE", detail: `دریافت checksum رسمی ممکن نشد: ${(error as Error).message}`, at };
  }
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, "");
}

async function identityCheck(pluginId: number, originalName: string, header: PluginHeader): Promise<ReleaseCheck> {
  const at = new Date().toISOString();
  const [prev] = await db
    .select({ header: pluginReleases.header, version: pluginReleases.sourceVersion })
    .from(pluginReleases)
    .where(and(eq(pluginReleases.pluginId, pluginId), sql`${pluginReleases.state} in ('published', 'retired')`))
    .orderBy(sql`${pluginReleases.publishedAt} desc nulls last`)
    .limit(1);
  // A previous release without a recorded package header is no identity reference.
  if (prev?.header.folder) {
    const diffs: string[] = [];
    if (prev.header.folder && header.folder !== prev.header.folder) diffs.push(`پوشه «${header.folder}» به‌جای «${prev.header.folder}»`);
    if (prev.header.textDomain && header.textDomain && header.textDomain !== prev.header.textDomain) diffs.push(`Text Domain «${header.textDomain}» به‌جای «${prev.header.textDomain}»`);
    if (prev.header.mainFile && header.mainFile !== prev.header.mainFile) diffs.push(`فایل اصلی «${header.mainFile}» به‌جای «${prev.header.mainFile}»`);
    if (diffs.length) return { status: "FAIL", detail: `بسته با افزونه نسخه ${prev.version} یکی نیست: ${diffs.join("؛ ")}`, at };
    return { status: "PASS", detail: `پوشه، فایل اصلی و Text Domain با نسخه ${prev.version} برابر است.`, at };
  }
  if (originalName && header.pluginName && norm(originalName) === norm(header.pluginName)) {
    return { status: "PASS", detail: `نام بسته با نام اصلی ثبت‌شده («${originalName}») برابر است.`, at };
  }
  return {
    status: "WARNING",
    detail: `اولین نسخه این افزونه است و مرجع هویت ندارد (نام بسته: «${header.pluginName ?? "?"}»، پوشه: «${header.folder ?? "?"}»)؛ مدیر باید تأیید کند.`,
    at,
  };
}

/**
 * Candidates newest first; equal versions by source priority (lower number =
 * more trusted). After them: the current version as announced by all
 * sources (to notice a different file under the same version — never
 * published automatically), then direct links whose version is only known
 * after download.
 */
export function rankCandidates(list: Candidate[], currentVersion: string, allowPrerelease: boolean) {
  const versioned = list.filter((c) => c.obs.version && parseVersion(c.obs.version) && (allowPrerelease || !isPrerelease(c.obs.version)));
  const newer = currentVersion ? versioned.filter((c) => isNewer(c.obs.version, currentVersion)) : versioned;
  newer.sort((a, b) => (compareVersions(b.obs.version, a.obs.version) ?? 0) || a.source.priority - b.source.priority || a.source.id - b.source.id);
  const equal = currentVersion ? versioned.filter((c) => compareVersions(c.obs.version, currentVersion) === 0) : [];
  const direct = list.filter((c) => !c.obs.version && c.obs.result === "ok").sort((a, b) => a.source.priority - b.source.priority);
  return [...newer, ...equal, ...direct];
}

const SAME_FILE = "same-file-verified";

export async function checkPlugin(pluginId: number, ctx: CheckContext): Promise<CheckOutcome> {
  const fetchText = ctx.fetchText ?? realFetchText;
  const fetchToFile = ctx.fetchToFile ?? realFetchToFile;
  const outcome: CheckOutcome = { status: "failed", sources: [], review: [], rejected: [], notes: [] };
  const [plugin] = await db.select().from(plugins).where(eq(plugins.id, pluginId)).limit(1);
  if (!plugin) throw new Error(`plugin ${pluginId} not found`);
  const sources = await db
    .select()
    .from(pluginSources)
    .where(and(eq(pluginSources.pluginId, pluginId), eq(pluginSources.enabled, true)))
    .orderBy(asc(pluginSources.priority), asc(pluginSources.id));
  if (sources.length === 0) {
    outcome.status = "no_sources";
    await db.update(plugins).set({ lastCheckedAt: new Date() }).where(eq(plugins.id, pluginId));
    return outcome;
  }
  const current = plugin.currentReleaseId
    ? (await db.select().from(pluginReleases).where(eq(pluginReleases.id, plugin.currentReleaseId)).limit(1))[0]
    : undefined;
  const currentVersion = current?.downloadable ? current.sourceVersion : "";

  // 1. Observe every source.
  const env: AdapterEnv = { fetchText, timeoutMs: ctx.cfg.fetchTimeoutMs, maxHtmlBytes: ctx.cfg.maxHtmlBytes, userAgent: ctx.cfg.userAgent };
  const candidates: Candidate[] = [];
  const lastHit = new Map<string, number>();
  for (const source of sources) {
    const host = (() => {
      try {
        return new URL(source.url).host;
      } catch {
        return "";
      }
    })();
    const wait = (lastHit.get(host) ?? 0) + (ctx.hostDelayMs ?? 1500) - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastHit.set(host, Date.now());
    // The HTML can stay identical while the ZIP changes. Always obtain the link
    // again; identity is established by bytes, never the announced version.
    const cfg: SourceConfig = { ...source, allowPrerelease: plugin.allowPrerelease, etag: "", lastModified: "" };
    const obs = await observeSource(cfg, env);
    ctx.log(`منبع #${source.id} (${redactUrl(source.url)}): ${obs.result}${obs.version ? ` نسخه ${obs.version}` : ""}${obs.error ? ` — ${obs.error}` : ""}`);
    const failed = obs.result === "error" || obs.result === "manual_setup_required";
    await db.insert(pluginSourceObservations).values({
      sourceId: source.id,
      sourceVersion: obs.version.slice(0, 40),
      candidateUrl: obs.downloadUrl ? redactUrl(obs.downloadUrl) : "",
      confidence: obs.confidence,
      evidence: obs.evidence.slice(0, 8).map((e) => e.slice(0, 200)),
      result: obs.result,
      error: obs.error.slice(0, 500),
    });
    await db
      .update(pluginSources)
      .set({
        lastStatus: obs.result === "ok" && !obs.downloadUrl && obs.version ? "unchanged" : obs.result,
        lastError: obs.error.slice(0, 500),
        ...(obs.version ? { lastVersion: obs.version.slice(0, 40) } : {}),
        lastCheckedAt: new Date(),
        consecutiveFailures: failed ? sql`${pluginSources.consecutiveFailures} + 1` : 0,
        ...(obs.etag || obs.lastModified ? { etag: obs.etag.slice(0, 200), lastModified: obs.lastModified.slice(0, 100) } : {}),
      })
      .where(eq(pluginSources.id, source.id));
    outcome.sources.push({ id: source.id, result: obs.result, version: obs.version, error: obs.error });
    if (obs.result === "ok") candidates.push({ source, obs });
  }

  // Icon from an official source, only when the admin has not set one.
  const withIcon = candidates.find((c) => c.obs.iconUrl);
  if (withIcon && !plugin.iconUrl && !plugin.draftData?.iconUrl) {
    const temp = await tempPath(ctx.cfg.filesDir);
    try {
      await fetchToFile(withIcon.obs.iconUrl, temp, { timeoutMs: ctx.cfg.fetchTimeoutMs, maxBytes: MAX_UPLOAD_BYTES, userAgent: ctx.cfg.userAgent });
      const icon = await saveImage(new File([new Uint8Array(await readFile(temp))], "icon"));
      if (icon) {
        const rows = await db.update(plugins).set({ iconUrl: icon, iconSource: "auto" }).where(and(eq(plugins.id, pluginId), eq(plugins.iconUrl, ""), sql`coalesce(${plugins.draftData}->>'iconUrl', '') = ''`)).returning({ id: plugins.id });
        if (!rows.length) await deleteImage(icon);
        else await ctx.invalidate();
      }
    } catch { outcome.notes.push("دریافت یا اعتبارسنجی آیکون رسمی موفق نبود؛ آیکون دستی حفظ شد."); }
    finally { await rm(temp, { force: true }); }
  }

  // 2. Try the newest candidates in order until one is published or queued for review.
  let ranked = rankCandidates(candidates, currentVersion, plugin.allowPrerelease);
  // A candidate with a page reading but no fresh link (304) needs the page again next time: skip it now.
  ranked = ranked.filter((c) => c.obs.downloadUrl);
  let settled = false;
  for (const cand of ranked) {
    if (settled) break;
    if (!(await ctx.stillOwned())) {
      outcome.status = "cancelled";
      return outcome;
    }
    const announced = cleanVersion(cand.obs.version);
    if ((await freeBytes(ctx.cfg.filesDir)) < ctx.cfg.minFreeBytes) {
      outcome.notes.push("فضای خالی دیسک کمتر از حد امن است؛ دریافت فایل جدید متوقف شد.");
      outcome.status = "failed";
      return outcome;
    }

    const temp = await tempPath(ctx.cfg.filesDir);
    let file;
    try {
      file = await fetchToFile(cand.obs.downloadUrl, temp, { timeoutMs: ctx.cfg.downloadTimeoutMs, maxBytes: ctx.cfg.maxZipBytes, userAgent: ctx.cfg.userAgent });
    } catch (error) {
      await rm(temp, { force: true });
      const reason = error instanceof FetchError ? error.message : (error as Error).message;
      ctx.log(`دریافت فایل ${announced || "(لینک مستقیم)"} ناموفق: ${reason}`);
      outcome.rejected.push({ version: announced, reason: `دریافت ناموفق: ${reason}` });
      continue;
    }
    const [dupe] = await db
      .select({ id: pluginReleases.id, state: pluginReleases.state, version: pluginReleases.sourceVersion, warnings: pluginReleases.warnings, reviewExpiresAt: pluginReleases.reviewExpiresAt })
      .from(pluginReleases)
      .where(and(eq(pluginReleases.pluginId, pluginId), eq(pluginReleases.sha256, file.sha256)))
      .limit(1);
    if (dupe && dupe.state !== "review" && dupe.state !== "candidate" && !dupe.warnings.includes("review-expired")) {
      await rm(temp, { force: true });
      if (announced) {
        await db.insert(pluginSourceObservations).values({ sourceId: cand.source.id, sourceVersion: announced, result: "ok", evidence: [SAME_FILE, file.sha256] });
      }
      outcome.notes.push(`فایل (${file.sha256.slice(0, 12)}…) همان نسخه ${dupe.version} ثبت‌شده است.`);

      continue;
    }

    // 3. Inspect, store privately, check.
    const checks: ReleaseChecks = {};
    const warnings: string[] = [];
    let report: PackageReport | null = null;
    try {
      report = await inspectPackage(temp, file.bytes, { maxEntries: ctx.cfg.maxEntries, maxUnpackedBytes: ctx.cfg.maxUnpackedBytes, maxRatio: ctx.cfg.maxRatio });
    } catch (error) {
      checks.validation = { status: "FAIL", detail: error instanceof ZipError ? error.message : `خطای بررسی آرشیو: ${(error as Error).message}`, at: new Date().toISOString() };
    }
    const storageKey = await commitObject(ctx.cfg.filesDir, temp, file.sha256);
    const header: PluginHeader = report ? { ...report.header, testedUpTo: report.readme?.testedUpTo || undefined, fileCount: report.fileCount, unpackedBytes: report.unpackedBytes } : {};
    const packageVersion = cleanVersion(header.version ?? "");
    const sourceVersion = announced || packageVersion;
    if (report) {
      warnings.push(...report.warnings);
      checks.validation = report.riskyBinaries.length
        ? { status: "WARNING", detail: `فایل اجرایی/باینری ناشناخته نیازمند بررسی: ${report.riskyBinaries.slice(0, 6).join("، ")}`, at: new Date().toISOString() }
        : { status: "PASS", detail: `ZIP سالم: ${report.fileCount} فایل، CRC و حجم همه فایل‌ها بررسی شد.`, at: new Date().toISOString() };
      checks.identity = await identityCheck(pluginId, plugin.originalName, header);
      checks.version = !parseVersion(sourceVersion)
        ? { status: "FAIL", detail: `نسخه «${sourceVersion.slice(0, 40)}» قابل مقایسه نیست.` }
        : packageVersion && compareVersions(packageVersion, sourceVersion) !== 0
          ? { status: "WARNING", detail: `نسخه اعلام‌شده منبع ${sourceVersion} است ولی سرآیند بسته ${packageVersion || "—"} می‌گوید (فقط هشدار).` }
          : { status: "PASS", detail: `نسخه منبع و بسته ${sourceVersion} است.` };
      if (checks.version.status === "WARNING") warnings.push(checks.version.detail);
      checks.checksum = await officialChecksums(cand.obs.checksumsUrl, report, ctx, fetchText);
      const prev = current?.header;
      if (prev?.fileCount && report.fileCount && Math.abs(report.fileCount - prev.fileCount) / prev.fileCount > 0.5) {
        warnings.push(`تعداد فایل‌ها از ${prev.fileCount} به ${report.fileCount} تغییر کرده است (فقط هشدار).`);
      }
      if (current && parseVersion(sourceVersion) && parseVersion(current.sourceVersion)) {
        const [a] = sourceVersion.split(".");
        const [b] = current.sourceVersion.split(".");
        if (a !== b) warnings.push(`تغییر نسخه اصلی (${current.sourceVersion} → ${sourceVersion}) — فقط هشدار.`);
      }
      if (!hardFailure(checks)) {
        checks.scan = await ctx.scan(objectPath(ctx.cfg.filesDir, storageKey), file.sha256);
        checks.sandbox = checks.scan.status !== "PASS" || checks.validation.status !== "PASS"
          ? { status: "NOT_APPLICABLE", detail: "تا تأیید کامل ساختار فایل و اسکن بدافزار، PHP اجرا نمی‌شود." }
          : await ctx.sandbox.run({ artifactPath: objectPath(ctx.cfg.filesDir, storageKey), sha256: file.sha256, mainFile: header.mainFile ?? "", wpVersion: "", phpVersion: "", requiresPlugins: header.requiresPlugins });
      }
    }
    const sameVersion = await db
      .select({ id: pluginReleases.id })
      .from(pluginReleases)
      .where(and(eq(pluginReleases.pluginId, pluginId), eq(pluginReleases.sourceVersion, sourceVersion), ...(dupe ? [ne(pluginReleases.id, dupe.id)] : [])))
      .limit(1);
    if (sameVersion.length) warnings.push(`نسخه ${sourceVersion} قبلاً با فایل دیگری ثبت شده است؛ فایل جدید جایگزین خودکار نمی‌شود.`);

    const fail = hardFailure(checks) ?? (checks.version?.status === "FAIL" ? `version: ${checks.version.detail}` : null);
    const newer = !currentVersion || isNewer(sourceVersion, currentVersion);
    const blockers = gateBlockers(checks, { newerThanCurrent: newer, sameVersionOtherFile: sameVersion.length > 0, autoUpdate: plugin.autoUpdate && ctx.cfg.autoUpdate });
    const changelog = (report?.readme?.changelog[sourceVersion] ?? "") || cand.obs.changelog;
    const reviewExpiresAt = dupe && !dupe.warnings.includes("review-expired") ? dupe.reviewExpiresAt : new Date(Date.now() + ctx.cfg.reviewTtlMs);
    const [row] = await db
      .insert(pluginReleases)
      .values({
        pluginId,
        sourceId: cand.source.id,
        sourceVersion: sourceVersion.slice(0, 40) || "?",
        packageVersion: packageVersion.slice(0, 40),
        prerelease: isPrerelease(sourceVersion),
        sha256: file.sha256,
        bytes: (await stat(objectPath(ctx.cfg.filesDir, storageKey))).size,
        storageKey,
        header,
        checks,
        warnings: warnings.map((w) => w.slice(0, 300)).slice(0, 20),
        changelog: changelog.slice(0, 3000),
        state: fail ? "rejected" : "review",
        reviewExpiresAt,
      })
      .onConflictDoUpdate({
        target: [pluginReleases.pluginId, pluginReleases.sha256],
        set: { checks, warnings: warnings.slice(0, 20), state: fail ? "rejected" : "review", fileDeletedAt: null, reviewExpiresAt },
        setWhere: sql`${pluginReleases.state} in ('review', 'candidate') or (${pluginReleases.state} = 'rejected' and ${pluginReleases.warnings} @> '["review-expired"]'::jsonb)`,
      })
      .returning({ id: pluginReleases.id });
    if (!row) {
      outcome.notes.push("این فایل هم‌زمان توسط اجرای دیگری ثبت شد.");
      settled = true;
      continue;
    }
    ctx.log(`نسخه ${sourceVersion} (${file.sha256.slice(0, 12)}…) ثبت شد: ${fail ? `رد — ${fail}` : blockers.length ? "منتظر بررسی مدیر" : "همه کنترل‌ها PASS"}`);
    if (fail) {
      outcome.rejected.push({ version: sourceVersion, reason: fail });
      continue; // try the next (older but still newer than current) candidate
    }
    if (blockers.length === 0 && (await ctx.stillOwned())) {
      await publishRelease(row.id, { userId: null, source: "auto" });
      await ctx.invalidate();
      outcome.published = { releaseId: row.id, version: sourceVersion };
      settled = true;
      continue;
    }
    outcome.review.push({ releaseId: row.id, version: sourceVersion, reasons: blockers });
    settled = true;
  }

  await db.update(plugins).set({ lastCheckedAt: new Date() }).where(eq(plugins.id, pluginId));
  const anyFailed = outcome.sources.some((s) => s.result === "error" || s.result === "manual_setup_required");
  const allManual = outcome.sources.every((s) => s.result === "manual_setup_required");
  if (outcome.published) outcome.status = "updated";
  else if (outcome.review.length) outcome.status = "review";
  else if (allManual) outcome.status = "manual_setup_required";
  else if (candidates.length === 0) outcome.status = "failed";
  else if (anyFailed || outcome.rejected.length) outcome.status = "partial";
  else outcome.status = "up_to_date";
  return outcome;
}
