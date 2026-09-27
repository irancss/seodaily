import { redirect } from "next/navigation";

import { LoginForm } from "@/components/organisms";
import { AdminAuthTemplate } from "@/components/templates";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata = { title: "ورود" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <AdminAuthTemplate title="ورود به پنل مدیریت">
      <LoginForm />
    </AdminAuthTemplate>
  );
}
