"use server";

import { failed, lines, rows, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { getContact, getGeneral, writeSetting } from "@/modules/settings/queries";
import { stageImage, UploadError, type StagedImage } from "@/modules/uploads/storage";

function cleanUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  return /^(https?:|mailto:|tel:|\/)/i.test(v) ? v : `https://${v}`;
}

export async function saveGeneral(form: FormData) {
  await requireAdmin();
  const current = await getGeneral();

  let siteUrl = str(form, "siteUrl", 200).replace(/\/+$/, "");
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) siteUrl = `https://${siteUrl}`;
  if (siteUrl && !URL.canParse(siteUrl)) failed("/admin/settings", "آدرس سایت معتبر نیست.");

  let ogImage: StagedImage;
  try {
    ogImage = await stageImage(form.get("ogImage"), current.ogImage, form.get("ogImage_remove") === "on");
  } catch (error) {
    if (error instanceof UploadError) failed("/admin/settings", error.message);
    throw error;
  }

  try {
    await writeSetting("general", {
      siteName: str(form, "siteName", 80) || current.siteName,
      siteUrl,
      footerDescription: str(form, "footerDescription", 400),
      footerNote: str(form, "footerNote", 120),
      industries: rows(form, "industries", ["title", "url"] as const).map((r) => ({ title: r.title, url: r.url ? cleanUrl(r.url) : "" })),
      budgets: lines(form, "budgets"),
      techOptions: lines(form, "techOptions"),
      ogImage: ogImage.url,
      googleVerification: str(form, "googleVerification", 200).replace(/^.*content="([^"]+)".*$/s, "$1"),
    });
  } catch (error) {
    await ogImage.rollback();
    throw error;
  }
  await ogImage.commit();
  saved("/admin/settings");
}

export async function saveContact(form: FormData) {
  await requireAdmin();
  const current = await getContact();
  await writeSetting("contact", {
    ...current,
    phone: str(form, "phone", 60),
    email: str(form, "email", 160),
    address: str(form, "address", 400),
    socials: rows(form, "socials", ["title", "url"] as const)
      .filter((r) => r.title && r.url)
      .map((r) => ({ title: r.title, url: cleanUrl(r.url) })),
  });
  saved("/admin/settings");
}
