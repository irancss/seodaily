import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { Icon } from "@/components/atoms";
import { AdminNav } from "@/components/organisms";
import { FlashToaster } from "@/components/organisms/flash-toaster";
import { logout } from "@/modules/auth/actions";

/** Admin panel skeleton: sidebar (brand, nav, account) and the main column. */
export function AdminShell({ user, newLeads, children }: { user: { email: string }; newLeads: number; children: ReactNode }) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[260px_minmax(0,1fr)]">
      <Suspense fallback={null}>
        <FlashToaster />
      </Suspense>
      <aside className="sticky top-0 z-20 border-b border-line bg-white lg:h-dvh lg:border-b-0 lg:border-l">
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="/admin" className="text-lg font-bold text-ink no-underline">
              پنل سئو دیلی
            </Link>
            <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-ink-2 no-underline hover:text-brand">
              مشاهده سایت
              <Icon name="external" size={14} />
            </Link>
          </div>
          <AdminNav newLeads={newLeads} />
          <div className="mt-auto hidden border-t border-line pt-4 lg:block">
            <p className="truncate text-xs text-muted" dir="ltr">
              {user.email}
            </p>
            <form action={logout} className="mt-2">
              <button type="submit" className="inline-flex h-10 cursor-pointer items-center gap-2 text-sm font-medium text-ink-2 hover:text-error">
                <Icon name="logout" size={18} />
                خروج
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1100px]">{children}</div>
        <form action={logout} className="mt-10 lg:hidden">
          <button type="submit" className="inline-flex h-10 items-center gap-2 text-sm font-medium text-ink-2">
            <Icon name="logout" size={18} />
            خروج از حساب
          </button>
        </form>
      </main>
    </div>
  );
}
