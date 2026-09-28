"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db, schema } from "@/db";
import { str } from "@/lib/form-actions";
import { hashPassword, requireAdmin, revokeOtherSessions } from "@/modules/auth/session";

function back(key: "ok" | "error", message: string): never {
  redirect(`/admin/account?${key}=${encodeURIComponent(message)}`);
}

export async function updateAccount(form: FormData) {
  const me = await requireAdmin();
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, me.id) });
  if (!user) back("error", "کاربر پیدا نشد.");

  const current = String(form.get("currentPassword") ?? "");
  if (!(await bcrypt.compare(current, user.passwordHash))) back("error", "رمز عبور فعلی نادرست است.");

  const email = str(form, "email", 160).toLowerCase();
  const name = str(form, "name", 80) || user.name;
  const next = String(form.get("newPassword") ?? "");
  const confirm = String(form.get("confirmPassword") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("error", "ایمیل معتبر نیست.");
  if (next && next.length < 8) back("error", "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.");
  if (next !== confirm) back("error", "تکرار رمز عبور جدید یکسان نیست.");

  try {
    await db
      .update(schema.users)
      .set({ email, name, ...(next ? { passwordHash: await hashPassword(next) } : {}) })
      .where(eq(schema.users.id, user.id));
  } catch {
    back("error", "این ایمیل برای کاربر دیگری ثبت شده است.");
  }
  // A new password signs out every other browser that was logged in.
  if (next) await revokeOtherSessions(user.id);
  back("ok", "حساب کاربری به‌روز شد.");
}
