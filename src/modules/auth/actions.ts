"use server";

import { redirect } from "next/navigation";

import { clientIp, slidingWindow } from "@/lib/rate-limit";

import { createSession, destroySession, verifyCredentials } from "@/modules/auth/session";

export type LoginState = { error?: string; email?: string };

// Brute-force brake over a 15-minute window: failed attempts per address and
// email, plus a looser cap per email so many addresses cannot keep guessing.
const failures = slidingWindow(15 * 60 * 1000);
const MAX_FAILS_PER_CLIENT = 8;
const MAX_FAILS_PER_EMAIL = 30;
const TOO_MANY = "تعداد تلاش‌های ناموفق زیاد است. ۱۵ دقیقه بعد دوباره امتحان کنید.";

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { error: "ایمیل و رمز عبور را وارد کنید.", email };

  const clientKey = `${await clientIp()}|${email}`;
  const emailKey = `email|${email}`;
  if (failures.count(clientKey) >= MAX_FAILS_PER_CLIENT || failures.count(emailKey) >= MAX_FAILS_PER_EMAIL) {
    return { error: TOO_MANY, email };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    failures.hit(clientKey);
    failures.hit(emailKey);
    return { error: "ایمیل یا رمز عبور نادرست است.", email };
  }

  failures.reset(clientKey);
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
