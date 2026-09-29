import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmButton, SubmitButton } from "@/components/atoms";
import { Card, PageHeader } from "@/components/molecules";
import { PluginsSubnav } from "@/components/organisms/admin/plugins/plugins-subnav";
import { downloadUser } from "@/modules/downloads/admin";
import { anonymizeUserAction, blockUserAction, revokeSessionsAction, unblockUserAction } from "@/modules/downloads/admin-actions";
import { localPhone } from "@/modules/downloads/phone";

export const metadata = { title: "کاربر دانلود" };

type Props = { params: Promise<{ id: string }> };

const when = (d: Date | string | null) => (d ? new Date(d).toLocaleString("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" }) : "—");
const KIND: Record<string, string> = { started: "شروع", served: "کامل", failed: "قطع/ناموفق", unknown: "ثبت بدون شمارش" };

export default async function DownloadUserPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const data = await downloadUser(id);
  if (!data) notFound();
  const { user, history, activeSessions } = data;
  const anon = Boolean(user.anonymizedAt);

  return (
    <>
      <PageHeader title={anon ? `کاربر ناشناس #${id}` : localPhone(user.phone)} back={{ href: "/admin/plugins/users", label: "دانلودکنندگان" }} />
      <PluginsSubnav />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card title="مشخصات">
          <dl className="grid gap-2 text-sm">
            <div className="flex gap-2"><dt className="text-muted">تأیید شماره:</dt><dd>{when(user.verifiedAt)}</dd></div>
            <div className="flex gap-2"><dt className="text-muted">ثبت اولیه:</dt><dd>{when(user.createdAt)}</dd></div>
            <div className="flex gap-2"><dt className="text-muted">آخرین فعالیت:</dt><dd>{when(user.lastSeenAt)}</dd></div>
            <div className="flex gap-2"><dt className="text-muted">آخرین دانلود:</dt><dd>{when(user.lastDownloadAt)}</dd></div>
            <div className="flex gap-2"><dt className="text-muted">نشست فعال:</dt><dd>{activeSessions.toLocaleString("fa-IR")}</dd></div>
            <div className="flex gap-2"><dt className="text-muted">وضعیت:</dt><dd className={user.blocked ? "text-error" : "text-success"}>{anon ? "ناشناس‌شده" : user.blocked ? `محدود (${user.blockedReason})` : "فعال"}</dd></div>
          </dl>
          {!anon && (
            <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
              {user.blocked ? (
                <form action={unblockUserAction}><input type="hidden" name="id" value={id} /><SubmitButton variant="secondary">برداشتن محدودیت</SubmitButton></form>
              ) : (
                <form action={blockUserAction} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={id} />
                  <label className="flex flex-col gap-1 text-xs"><span className="font-medium">دلیل محدودکردن</span><input name="reason" required maxLength={300} className="field h-10 text-sm" /></label>
                  <SubmitButton variant="danger">محدودکردن و باطل‌کردن نشست‌ها</SubmitButton>
                </form>
              )}
              <form action={revokeSessionsAction}><input type="hidden" name="id" value={id} /><SubmitButton variant="secondary">خروج از همه مرورگرها</SubmitButton></form>
              <form action={anonymizeUserAction}>
                <input type="hidden" name="id" value={id} />
                <ConfirmButton message="شماره این کاربر برای همیشه حذف شود؟ آمار کلی دانلود حفظ می‌شود ولی به این شماره قابل ردیابی نیست.">حذف شماره (ناشناس‌سازی)</ConfirmButton>
              </form>
            </div>
          )}
        </Card>
        <Card title="تاریخچه دانلود" description="آخرین ۲۰۰ رویداد. این تاریخچه فقط در پنل است و صفحه عمومی ندارد.">
          {history.length === 0 ? (
            <p className="text-sm text-muted">دانلودی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="border-b border-line text-xs text-muted"><th scope="col" className="py-2 text-start font-medium">زمان</th><th scope="col" className="py-2 text-start font-medium">افزونه</th><th scope="col" className="py-2 text-start font-medium">نسخه</th><th scope="col" className="py-2 text-start font-medium">وضعیت</th></tr></thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-line last:border-b-0">
                      <td className="py-2">{when(h.at)}</td>
                      <td className="py-2">{h.pluginId ? <Link href={`/admin/plugins/${h.pluginId}`}>{h.plugin}</Link> : "—"}</td>
                      <td className="py-2" dir="ltr">{h.version ?? "—"}</td>
                      <td className="py-2">{KIND[h.kind] ?? h.kind}{h.detail ? ` (${h.detail})` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
