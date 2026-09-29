import Link from "next/link";

import { Card, PageHeader } from "@/components/molecules";
import { PluginsSubnav } from "@/components/organisms/admin/plugins/plugins-subnav";
import { downloadStats, listDownloadUsers } from "@/modules/downloads/admin";
import { maskPhone } from "@/modules/downloads/phone";

export const metadata = { title: "دانلودکنندگان و آمار" };

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

const fa = (n: number) => Number(n ?? 0).toLocaleString("fa-IR");
const when = (d: Date | string | null) => (d ? new Date(d).toLocaleString("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" }) : "—");
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100).toLocaleString("fa-IR")}٪` : "—");

export default async function DownloadUsers({ searchParams }: Props) {
  const sp = await searchParams;
  const q = String(sp.q ?? "").slice(0, 30);
  const page = Math.max(1, Number(sp.page) || 1);
  const [s, list] = await Promise.all([downloadStats(), listDownloadUsers({ q, page })]);

  return (
    <>
      <PageHeader title="دانلودکنندگان و آمار" back={{ href: "/admin/plugins", label: "افزونه‌ها" }} />
      <PluginsSubnav />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="کاربران و کد تأیید" description="۷ روز گذشته.">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-page p-3"><dt className="text-xs text-muted">شماره تأییدشده (کل)</dt><dd className="text-lg font-bold">{fa(s.users)}</dd></div>
            <div className="rounded-lg bg-page p-3"><dt className="text-xs text-muted">تأیید در ۷ روز</dt><dd className="text-lg font-bold">{fa(s.users7)}</dd></div>
            <div className="rounded-lg bg-page p-3"><dt className="text-xs text-muted">پیامک پذیرفته‌شده</dt><dd className="text-lg font-bold">{fa(s.otp_sent7)}</dd></div>
            <div className="rounded-lg bg-page p-3"><dt className="text-xs text-muted">ارسال ناموفق/نامعلوم</dt><dd className="text-lg font-bold">{fa(s.otp_failed7)}</dd></div>
          </dl>
          <p className="mt-3 text-sm">
            نرخ تأیید: <strong>{pct(s.otp_verified7, s.otp_sent7)}</strong>
            <span className="block text-xs text-muted">= کدهای تأییدشده ({fa(s.otp_verified7)}) ÷ پیامک‌های پذیرفته‌شده توسط سرویس ({fa(s.otp_sent7)})</span>
          </p>
        </Card>
        <Card title="دانلود کامل" description="فقط دانلودهای ثبت‌شده (بدون عدد پایه)؛ روزها به وقت تهران.">
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-page p-3"><dt className="text-xs text-muted">امروز</dt><dd className="text-lg font-bold">{fa(s.served_today)}</dd></div>
            <div className="rounded-lg bg-page p-3"><dt className="text-xs text-muted">۷ روز</dt><dd className="text-lg font-bold">{fa(s.served7)}</dd></div>
            <div className="rounded-lg bg-page p-3"><dt className="text-xs text-muted">۳۰ روز</dt><dd className="text-lg font-bold">{fa(s.served30)}</dd></div>
          </dl>
          <p className="mt-3 text-sm">
            نسبت تکمیل: <strong>{pct(s.served30, s.started30)}</strong>
            <span className="block text-xs text-muted">= دانلود کامل ÷ دانلود شروع‌شده در ۳۰ روز. قطع‌شده‌ها ۷ روز: {fa(s.failed7)}. «کامل» یعنی سرور آخرین بایت را فرستاد، نه اینکه فایل حتماً روی رایانه کاربر ذخیره شده باشد.</span>
          </p>
        </Card>
        <Card title="پردانلودترین‌ها (۳۰ روز)">
          {s.top.length === 0 ? (
            <p className="text-sm text-muted">هنوز دانلودی ثبت نشده است.</p>
          ) : (
            <ol className="list-decimal ps-5 text-sm leading-[2]">
              {s.top.map((t) => (
                <li key={t.id}>
                  <Link href={`/admin/plugins/${t.id}`}>{t.name}</Link> — {fa(t.n)}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="کاربران دانلود">
          <form className="mb-4 flex gap-2" role="search">
            <label htmlFor="q" className="sr-only">جست‌وجوی شماره</label>
            <input id="q" name="q" defaultValue={q} dir="ltr" inputMode="tel" placeholder="0912…" className="field h-10 flex-1" />
            <button className="btn btn-secondary h-10 px-4 text-sm">جست‌وجو</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th scope="col" className="py-2 text-start font-medium">شماره</th>
                  <th scope="col" className="py-2 text-start font-medium">تأیید</th>
                  <th scope="col" className="py-2 text-start font-medium">آخرین دانلود</th>
                  <th scope="col" className="py-2 text-start font-medium">دانلود کامل</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-b-0">
                    <td className="py-2">
                      <Link href={`/admin/plugins/users/${u.id}`} dir="ltr">{u.anonymizedAt ? "ناشناس" : maskPhone(u.phone)}</Link>
                      {u.blocked && !u.anonymizedAt && <span className="ms-2 text-xs text-error">محدود</span>}
                    </td>
                    <td className="py-2">{when(u.verifiedAt)}</td>
                    <td className="py-2">{when(u.lastDownloadAt)}</td>
                    <td className="py-2">{fa(u.served)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.rows.length === 0 && <p className="text-sm text-muted">کاربری پیدا نشد.</p>}
          {list.pages > 1 && (
            <nav aria-label="صفحه‌بندی" className="mt-4 flex gap-2 text-sm">
              {page > 1 && <Link href={`?${new URLSearchParams({ q, page: String(page - 1) })}`}>قبلی</Link>}
              <span>صفحه {fa(page)} از {fa(list.pages)}</span>
              {page < list.pages && <Link href={`?${new URLSearchParams({ q, page: String(page + 1) })}`}>بعدی</Link>}
            </nav>
          )}
        </Card>
        <div className="flex flex-col gap-6">
          <Card title="خروجی CSV" description="فقط برای مدیر؛ هر خروجی در گزارش تغییرات ثبت می‌شود. در Excel از Data → From Text/CSV با UTF-8 باز کنید؛ شماره‌ها با ' شروع می‌شوند تا صفر و +۹۸ حذف نشود.">
            <form action="/admin/plugins-export" method="get" className="flex flex-col gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="font-medium">نوع</span>
                <select name="type" className="field h-10 py-0">
                  <option value="users">شماره‌های تأییدشده</option>
                  <option value="downloads">تاریخچه دانلود</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1"><span className="font-medium">از (میلادی)</span><input type="date" name="from" className="field h-10" /></label>
                <label className="flex flex-col gap-1"><span className="font-medium">تا</span><input type="date" name="to" className="field h-10" /></label>
              </div>
              <button className="btn btn-secondary h-10 text-sm">دریافت CSV</button>
            </form>
          </Card>
          <Card title="۱۴ روز اخیر">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted"><th scope="col" className="text-start font-medium">روز</th><th scope="col" className="text-start font-medium">شروع</th><th scope="col" className="text-start font-medium">کامل</th></tr></thead>
              <tbody>
                {s.daily.map((d) => (
                  <tr key={d.day}>
                    <td className="py-1">{new Date(`${d.day}T12:00:00Z`).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran", month: "short", day: "numeric" })}</td>
                    <td className="py-1">{fa(d.started)}</td>
                    <td className="py-1">{fa(d.served)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}
