"use server";

import { redirect } from "next/navigation";

import { createSession, destroySession, verifyCredentials } from "@/modules/auth/session";

export type LoginState = { error?: string; email?: string };

// Brute-force brake: failed attempts per email in a sliding window.
const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "ایمیل و رمز عبور را وارد کنید.", email };

  const now = Date.now();
  const recent = (attempts.get(email) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_FAILS) {
    return { error: "تعداد تلاش‌های ناموفق زیاد است. ۱۵ دقیقه بعد دوباره امتحان کنید.", email };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    attempts.set(email, [...recent, now]);
    return { error: "ایمیل یا رمز عبور نادرست است.", email };
  }

  attempts.delete(email);
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
