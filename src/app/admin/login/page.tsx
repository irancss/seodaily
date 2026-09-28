import { redirect } from "next/navigation";

import { LoginForm } from "@/components/organisms";
import { AdminAuthTemplate } from "@/components/templates";
import { safeAdminPath } from "@/modules/auth/next-path";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata = { title: "ورود" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeAdminPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AdminAuthTemplate title="ورود به پنل مدیریت">
      <LoginForm next={next} />
    </AdminAuthTemplate>
  );
}
