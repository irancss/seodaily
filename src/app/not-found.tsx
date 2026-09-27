import Link from "next/link";

export const metadata = { title: "صفحه پیدا نشد", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <span className="text-5xl leading-[1.5] font-bold text-brand">۴۰۴</span>
      <h1 className="text-2xl leading-[1.6] font-bold">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
      <Link href="/" className="btn btn-primary h-12 px-6">
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}
