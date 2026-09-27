import { PageHeader } from "@/components/molecules";
import { DashboardStats, LatestLeads, QuickActions } from "@/components/organisms/admin";
import { getDashboardData } from "@/modules/admin/dashboard-queries";

export const metadata = { title: "داشبورد" };

export default async function Dashboard() {
  const { counts, latest } = await getDashboardData();

  return (
    <>
      <PageHeader title="داشبورد" description="خلاصه وضعیت سایت و آخرین درخواست‌های مشاوره." />
      <DashboardStats {...counts} />
      <LatestLeads leads={latest} />
      <QuickActions />
    </>
  );
}
