import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { LoginForm } from "./login-form";

export const metadata = { title: "ورود" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px] rounded-xl border border-line bg-white p-8 shadow-md">
        <p className="text-sm font-medium text-brand-hover">سئو دیلی</p>
        <h1 className="mt-1 text-2xl leading-[1.6] font-bold">ورود به پنل مدیریت</h1>
        <LoginForm />
      </div>
    </main>
  );
}
