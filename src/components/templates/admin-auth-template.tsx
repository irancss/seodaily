import type { ReactNode } from "react";

/** Centered card for the signed-out admin screens (login). */
export function AdminAuthTemplate({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px] rounded-xl border border-line bg-white p-8 shadow-md">
        <p className="text-sm font-medium text-brand-hover">سئو دیلی</p>
        <h1 className="mt-1 text-2xl leading-[1.6] font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
