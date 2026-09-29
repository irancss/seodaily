import path from "node:path";

// Operational limits of the plugin pipeline, read from the environment with
// safe defaults (docs/plugins/OPERATIONS-RUNBOOK.md lists every name).

function num(name: string, fallback: number, min = 0) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= min ? v : fallback;
}

function flag(name: string, fallback: boolean) {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export function pipelineConfig() {
  const filesDir = path.resolve(/*turbopackIgnore: true*/ process.env.PLUGIN_FILES_DIR || "/app/plugin-files");
  return {
    filesDir,
    tmpDir: path.join(filesDir, "tmp"),
    objectsDir: path.join(filesDir, "objects"),
    /** Feature flags (docs: OPERATIONS-RUNBOOK.md). */
    autoUpdate: flag("PLUGINS_AUTO_UPDATE_ENABLED", true),
    maxZipBytes: num("PLUGIN_MAX_ZIP_MB", 100, 1) * 1024 * 1024,
    maxUnpackedBytes: num("PLUGIN_MAX_UNPACKED_MB", 400, 1) * 1024 * 1024,
    maxEntries: num("PLUGIN_MAX_ENTRIES", 20000, 10),
    maxRatio: num("PLUGIN_MAX_RATIO", 200, 10),
    maxHtmlBytes: num("PLUGIN_MAX_HTML_KB", 3072, 64) * 1024,
    fetchTimeoutMs: num("PLUGIN_FETCH_TIMEOUT_S", 30, 5) * 1000,
    downloadTimeoutMs: num("PLUGIN_DOWNLOAD_TIMEOUT_S", 300, 30) * 1000,
    maxRedirects: 5,
    minFreeBytes: num("PLUGIN_DISK_MIN_FREE_MB", 2048, 100) * 1024 * 1024,
    tmpTtlMs: num("PLUGIN_TMP_TTL_H", 6, 1) * 3600_000,
    rejectedTtlMs: num("PLUGIN_REJECTED_TTL_D", 7, 1) * 86400_000,
    reviewTtlMs: num("PLUGIN_REVIEW_TTL_D", 30, 7) * 86400_000,
    retiredGraceMs: num("PLUGIN_RETIRED_GRACE_MIN", 60, 15) * 60_000,
    workerConcurrency: num("PLUGIN_WORKER_CONCURRENCY", 2, 1),
    clamdHost: process.env.CLAMD_HOST || "",
    clamdPort: num("CLAMD_PORT", 3310, 1),
    clamdTimeoutMs: num("CLAMD_TIMEOUT_S", 120, 5) * 1000,
    clamMaxSignatureAgeH: num("CLAMAV_MAX_SIGNATURE_AGE_H", 72, 1),
    sandboxUrl: process.env.PLUGIN_SANDBOX_URL || "",
    sandboxToken: process.env.PLUGIN_SANDBOX_TOKEN || "",
    sandboxTimeoutMs: num("PLUGIN_SANDBOX_TIMEOUT_S", 240, 30) * 1000,
    /** Where the worker asks the web app to expire its page cache after a publish. */
    appInternalUrl: process.env.APP_INTERNAL_URL || "",
    internalSecret: process.env.INTERNAL_API_SECRET || "",
    userAgent: "SEOdailyPluginMonitor/1.0 (+https://seodaily.ir)",
  };
}

export type PipelineConfig = ReturnType<typeof pipelineConfig>;
