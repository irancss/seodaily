"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";

import { db, schema } from "@/db";
import { CONTENT_TAG } from "@/lib/cache";
import { bool, failed, int, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";

import { audit } from "./audit";
import { observeSource, type Observation } from "./pipeline/adapters";
import { pipelineConfig } from "./pipeline/config";
import { enqueueCheck, requestCancel } from "./pipeline/jobs";
import { publishRelease, rejectRelease, ReleaseError, withdrawRelease } from "./pipeline/releases";
import { checkUrl, FetchError, fetchText } from "./pipeline/safe-fetch";

const ADAPTERS = ["auto", "wordpress_org", "github", "html", "direct"];
const back = (pluginId: number, hash = "") => `/admin/plugins/${pluginId}/sources${hash}`;

function sourceInput(form: FormData) {
  const url = str(form, "url", 1000);
  const downloadUrl = str(form, "downloadUrl", 1000);
  checkUrl(url);
  if (downloadUrl) checkUrl(downloadUrl.replace(/\{version\}/g, "1.0.0"));
  const regex = str(form, "versionRegex", 200);
  if (regex) new RegExp(regex); // throws SyntaxError for an invalid pattern
  const adapter = str(form, "adapter", 30);
  return {
    url,
    adapter: ADAPTERS.includes(adapter) ? adapter : "auto",
    versionSelector: str(form, "versionSelector", 300),
    versionAttribute: str(form, "versionAttribute", 60),
    versionRegex: regex,
    downloadSelector: str(form, "downloadSelector", 300),
    downloadUrl,
    priority: Math.max(1, Math.min(99, int(form, "priority", 10))),
    enabled: bool(form, "enabled"),
    notes: str(form, "notes", 1000),
  };
}

function reason(error: unknown) {
  if (error instanceof FetchError) return error.message;
  if (error instanceof SyntaxError) return "regex نسخه معتبر نیست.";
  return null;
}

export async function saveSourceAction(form: FormData) {
  const user = await requireAdmin();
  const pluginId = int(form, "pluginId");
  const id = int(form, "id");
  let input;
  try {
    input = sourceInput(form);
  } catch (error) {
    const r = reason(error);
    if (r) failed(back(pluginId, id ? `#source-${id}` : "#new-source"), r);
    throw error;
  }
  if (id) {
    // Changing the URL or the rules invalidates the conditional-request cache of the old page.
    await db
      .update(schema.pluginSources)
      .set({ ...input, etag: "", lastModified: "" })
      .where(and(eq(schema.pluginSources.id, id), eq(schema.pluginSources.pluginId, pluginId)));
  } else {
    await db.insert(schema.pluginSources).values({ ...input, pluginId });
  }
  await audit(user.id, id ? "source.update" : "source.create", { type: "plugin", id: pluginId }, { url: input.url.slice(0, 200) });
  saved(back(pluginId), "منبع ذخیره شد.");
}

export async function deleteSourceAction(form: FormData) {
  const user = await requireAdmin();
  const pluginId = int(form, "pluginId");
  const id = int(form, "id");
  await db.delete(schema.pluginSources).where(and(eq(schema.pluginSources.id, id), eq(schema.pluginSources.pluginId, pluginId)));
  await audit(user.id, "source.delete", { type: "plugin", id: pluginId }, { sourceId: id });
  saved(back(pluginId), "منبع حذف شد. نسخه‌های قبلی آن حفظ شده‌اند.");
}

export type TestResult = { ok: boolean; observation?: Observation; error?: string };

/**
 * Reads the source page once (no file download) and shows what the adapter
 * would choose, with the reasons. The package itself is only fetched by the
 * worker.
 */
export async function testSourceAction(_prev: TestResult | null, form: FormData): Promise<TestResult> {
  await requireAdmin();
  let input;
  try {
    input = sourceInput(form);
  } catch (error) {
    const r = reason(error);
    if (r) return { ok: false, error: r };
    throw error;
  }
  const cfg = pipelineConfig();
  const observation = await observeSource(
    { ...input, allowPrerelease: bool(form, "allowPrerelease") },
    { fetchText, timeoutMs: Math.min(cfg.fetchTimeoutMs, 20_000), maxHtmlBytes: cfg.maxHtmlBytes, userAgent: cfg.userAgent },
  );
  return { ok: observation.result === "ok", observation };
}

export async function checkNowAction(form: FormData) {
  const user = await requireAdmin();
  const pluginId = int(form, "pluginId");
  const [source] = await db.select({ id: schema.pluginSources.id }).from(schema.pluginSources).where(and(eq(schema.pluginSources.pluginId, pluginId), eq(schema.pluginSources.enabled, true))).limit(1);
  if (!source) failed(back(pluginId), "این افزونه منبع فعالی ندارد.");
  const job = await enqueueCheck(pluginId, "admin", `manual:${pluginId}:${Date.now()}`);
  await audit(user.id, "plugin.check_now", { type: "plugin", id: pluginId }, { jobId: job.id, joined: !job.created });
  saved(back(pluginId, "#jobs"), job.created ? "بررسی در صف قرار گرفت؛ نتیجه چند لحظه بعد همین‌جا دیده می‌شود." : "یک بررسی برای این افزونه در صف یا در حال اجراست؛ نتیجه همان را ببینید.");
}

export async function cancelJobAction(form: FormData) {
  const user = await requireAdmin();
  const pluginId = int(form, "pluginId");
  const jobId = int(form, "jobId");
  const ok = await requestCancel(jobId);
  await audit(user.id, "job.cancel", { type: "job", id: jobId }, { pluginId });
  if (!ok) failed(back(pluginId, "#jobs"), "این کار دیگر در صف یا در حال اجرا نیست.");
  saved(back(pluginId, "#jobs"), "درخواست لغو ثبت شد؛ کار پیش از هر انتشار متوقف می‌شود.");
}

async function releaseAction(form: FormData, run: (releaseId: number, userId: number) => Promise<unknown>, message: string) {
  const user = await requireAdmin();
  const pluginId = int(form, "pluginId");
  const releaseId = int(form, "releaseId");
  const [rel] = await db.select({ pluginId: schema.pluginReleases.pluginId }).from(schema.pluginReleases).where(eq(schema.pluginReleases.id, releaseId)).limit(1);
  if (!rel || rel.pluginId !== pluginId) failed(back(pluginId, "#releases"), "نسخه پیدا نشد.");
  try {
    await run(releaseId, user.id);
  } catch (error) {
    if (error instanceof ReleaseError) failed(back(pluginId, `#release-${releaseId}`), error.message);
    throw error;
  }
  updateTag(CONTENT_TAG);
  saved(back(pluginId, "#releases"), message);
}

export async function publishReleaseAction(form: FormData) {
  const override = str(form, "override", 500);
  await releaseAction(form, (id, userId) => publishRelease(id, { userId, source: "admin", override: override || undefined }), "نسخه منتشر شد و در دسترس دانلود است.");
}

export async function rejectReleaseAction(form: FormData) {
  await releaseAction(form, (id, userId) => rejectRelease(id, userId, str(form, "reason", 300) || "رد توسط مدیر"), "نسخه رد شد و فایل آن طبق زمان نگهداری پاک می‌شود.");
}

export async function withdrawReleaseAction(form: FormData) {
  await releaseAction(form, (id, userId) => withdrawRelease(id, userId, str(form, "reason", 300)), "فایل از دسترس خارج شد؛ لینک‌های قبلی هم دیگر کار نمی‌کنند.");
}
