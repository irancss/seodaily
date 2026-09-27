import { Flash, PageHeader } from "@/components/molecules";
import { AccountForm } from "@/components/organisms/admin";
import { requireAdmin } from "@/modules/auth/session";

export const metadata = { title: "حساب کاربری" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, user] = await Promise.all([searchParams, requireAdmin()]);
  return (
    <>
      <PageHeader title="حساب کاربری" description="ایمیل ورود و رمز عبور پنل مدیریت." />
      <Flash ok={sp.ok} error={sp.error} />
      <AccountForm user={user} />
    </>
  );
}
