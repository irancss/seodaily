import { PageHeader } from "@/components/molecules";
import { AccountForm } from "@/components/organisms/admin";
import { requireAdmin } from "@/modules/auth/session";

export const metadata = { title: "حساب کاربری" };

export default async function AccountPage() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader title="حساب کاربری" description="ایمیل ورود و رمز عبور پنل مدیریت." />
      <AccountForm user={user} />
    </>
  );
}
