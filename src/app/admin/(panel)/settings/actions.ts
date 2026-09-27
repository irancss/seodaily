"use server";

import { failed, lines, rows, saved, str } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { getContact, getGeneral, writeSetting } from "@/lib/settings";
import { deleteImage, saveImage, UploadError } from "@/lib/uploads";

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

  let ogImage = current.ogImage;
  try {
    const uploaded = await saveImage(form.get("ogImage"));
    if (uploaded || form.get("ogImage_remove") === "on") {
      await deleteImage(ogImage);
      ogImage = uploaded ?? "";
    }
  } catch (error) {
    if (error instanceof UploadError) failed("/admin/settings", error.message);
    throw error;
  }

  await writeSetting("general", {
    siteName: str(form, "siteName", 80) || current.siteName,
    siteUrl,
    footerDescription: str(form, "footerDescription", 400),
    footerNote: str(form, "footerNote", 120),
    industries: rows(form, "industries", ["title", "url"] as const).map((r) => ({ title: r.title, url: r.url ? cleanUrl(r.url) : "/contact" })),
    budgets: lines(form, "budgets"),
    techOptions: lines(form, "techOptions"),
    ogImage,
    googleVerification: str(form, "googleVerification", 200).replace(/^.*content="([^"]+)".*$/s, "$1"),
  });
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
