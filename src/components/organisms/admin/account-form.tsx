import { SubmitButton } from "@/components/atoms";
import { Card, Field } from "@/components/molecules";
import { updateAccount } from "@/modules/auth/account-actions";

export function AccountForm({ user }: { user: { name: string; email: string } }) {
  return (
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
  );
}
