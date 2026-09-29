"use server";

import { failed, int, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";

import { anonymizeUser, revokeUserSessions, setUserBlocked } from "./admin";

const back = (id: number) => `/admin/plugins/users/${id}`;

export async function blockUserAction(form: FormData) {
  const admin = await requireAdmin();
  const id = int(form, "id");
  const reason = str(form, "reason", 300);
  if (!reason) failed(back(id), "دلیل محدودکردن را بنویسید.");
  await setUserBlocked(id, true, reason, admin.id);
  saved(back(id), "کاربر محدود شد و همه نشست‌ها و لینک‌هایش باطل شد.");
}

export async function unblockUserAction(form: FormData) {
  const admin = await requireAdmin();
  const id = int(form, "id");
  await setUserBlocked(id, false, "", admin.id);
  saved(back(id), "محدودیت برداشته شد.");
}

export async function revokeSessionsAction(form: FormData) {
  const admin = await requireAdmin();
  const id = int(form, "id");
  await revokeUserSessions(id, admin.id);
  saved(back(id), "همه نشست‌های دانلود این کاربر باطل شد.");
}

export async function anonymizeUserAction(form: FormData) {
  const admin = await requireAdmin();
  const id = int(form, "id");
  await anonymizeUser(id, admin.id);
  saved(back(id), "شماره حذف و کاربر ناشناس شد؛ آمار کلی حفظ شد.");
}
