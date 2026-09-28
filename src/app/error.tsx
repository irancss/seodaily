"use client";

import Link from "next/link";
import { useEffect } from "react";

import { PhoneLink } from "@/components/atoms/phone-link";
import { DEFAULT_CONTACT } from "@/modules/settings/defaults";

/**
 * Shown when a page fails on the server (for example while the database is
 * unreachable). The live settings may be what failed, so the phone is the
 * built-in default contact number.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error.digest ? `page error (digest ${error.digest})` : error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
      <h1 className="text-2xl leading-[1.6] font-bold">نمایش این صفحه با مشکل روبه‌رو شد</h1>
      <p className="max-w-md leading-[1.9] text-ink-2">
        لطفاً چند لحظه بعد دوباره امتحان کنید. اگر عجله دارید، می‌توانید مستقیم تماس بگیرید.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary h-12 px-6">
          تلاش دوباره
        </button>
        <Link href="/" className="btn btn-secondary h-12 px-6">
          صفحه اصلی
        </Link>
      </div>
      <PhoneLink phone={DEFAULT_CONTACT.phone} className="font-bold text-brand" />
    </main>
  );
}
