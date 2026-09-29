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

  // The ID ends up inside an inline script, so only the exact GTM format is stored.
  // A pasted snippet is accepted and reduced to its ID.
  const gtmInput = str(form, "gtmId", 4000).toUpperCase();
  const gtmId = /GTM-[A-Z0-9]{4,12}\b/.exec(gtmInput)?.[0] ?? "";
  if (gtmInput && !gtmId) failed("/admin/settings", "شناسه Google Tag Manager باید به شکل GTM-XXXXXXX باشد.");

  let ogImage: StagedImage;
  try {
    ogImage = await stageImage(form.get("ogImage"), current.ogImage, form.get("ogImage_remove") === "on");
  } catch (error) {
    if (error instanceof UploadError) failed("/admin/settings", error.message);
    throw error;
  }

  try {
    await writeSetting("general", {
      ...current,
      siteName: str(form, "siteName", 80) || current.siteName,
      siteUrl,
      footerDescription: str(form, "footerDescription", 400),
      footerNote: str(form, "footerNote", 120),
      industries: rows(form, "industries", ["title", "url"] as const).map((r) => ({ title: r.title, url: r.url ? cleanUrl(r.url) : "" })),
      budgets: lines(form, "budgets"),
      techOptions: lines(form, "techOptions"),
      ogImage: ogImage.url,
      googleVerification: str(form, "googleVerification", 200).replace(/^.*content="([^"]+)".*$/s, "$1"),
      gtmId,
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

/** Each logo has its own form, keeping requests within the image upload limit. */
export async function saveLogo(key: "headerLogo" | "footerLogo", form: FormData) {
  await requireAdmin();
  if (key !== "headerLogo" && key !== "footerLogo") throw new Error("Invalid logo setting");
  const current = await getGeneral();
  let image: StagedImage;
  try {
    image = await stageImage(form.get(key), current[key], form.get(`${key}_remove`) === "on");
  } catch (error) {
    if (error instanceof UploadError) failed("/admin/settings", error.message);
    throw error;
  }
  try {
    await writeSetting("general", { ...current, [key]: image.url });
  } catch (error) {
    await image.rollback();
    throw error;
  }
  await image.commit();
  saved("/admin/settings");
}
