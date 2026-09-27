"use server";

import { failed, saved } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { writeSetting } from "@/modules/settings/queries";

import { normalizeMenu } from "./normalize";
import { MENUS_SETTING_KEY } from "./queries";

function parse(form: FormData, key: string) {
  try {
    return JSON.parse(String(form.get(key) ?? "[]"));
  } catch {
    return null;
  }
}

export async function saveMenus(form: FormData) {
  await requireAdmin();
  const desktop = parse(form, "desktop");
  const mobile = parse(form, "mobile");
  if (desktop === null || mobile === null) failed("/admin/menus", "داده منو معتبر نیست.");
  await writeSetting(MENUS_SETTING_KEY, { desktop: normalizeMenu(desktop), mobile: normalizeMenu(mobile) });
  saved("/admin/menus", "منوها ذخیره شد.");
}

export async function resetMenus() {
  await requireAdmin();
  // Removing the stored value brings back the default menus.
  await writeSetting(MENUS_SETTING_KEY, {});
  saved("/admin/menus", "منوها به حالت پیش‌فرض برگشت.");
}
