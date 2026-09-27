import { SubmitButton } from "@/components/admin/client";
import { Card, Field, Flash, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";

import { updateAccount } from "./actions";

export const metadata = { title: "حساب کاربری" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, user] = await Promise.all([searchParams, requireAdmin()]);
  return (
    <>
      <PageHeader title="حساب کاربری" description="ایمیل ورود و رمز عبور پنل مدیریت." />
      <Flash ok={sp.ok} error={sp.error} />
      <Card className="max-w-[640px]">
        <form action={updateAccount} className="grid gap-5">
          <Field label="نام" name="name" defaultValue={user.name} />
          <Field label="ایمیل" name="email" type="email" defaultValue={user.email} dir="ltr" required />
          <Field label="رمز عبور جدید" name="newPassword" type="password" dir="ltr" hint="برای تغییر ندادن رمز، خالی بگذارید. حداقل ۸ کاراکتر." />
          <Field label="تکرار رمز عبور جدید" name="confirmPassword" type="password" dir="ltr" />
          <Field label="رمز عبور فعلی" name="currentPassword" type="password" dir="ltr" required hint="برای تأیید تغییرات لازم است." />
          <div><SubmitButton /></div>
        </form>
      </Card>
    </>
  );
}
