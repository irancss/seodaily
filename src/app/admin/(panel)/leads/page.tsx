import { PageHeader } from "@/components/molecules";
import { LeadsFilter, LeadsTable, Pagination } from "@/components/organisms/admin";
import { LEAD_STATUSES, type LeadStatus } from "@/db/schema";
import { listLeads } from "@/modules/admin/leads-queries";
import { leadsHref } from "@/modules/admin/leads-routes";

export const metadata = { title: "درخواست‌های مشاوره" };

type Props = { searchParams: Promise<{ status?: string; page?: string; ok?: string; error?: string }> };

export default async function LeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = LEAD_STATUSES.includes(sp.status as LeadStatus) ? (sp.status as LeadStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, pages } = await listLeads(status, page);

  return (
    <>
      <PageHeader title="درخواست‌های مشاوره" description="فرم‌هایی که از صفحه تماس و ماشین‌حساب صفحه تعرفه‌ها ارسال شده‌اند." />
      <LeadsFilter status={status} />
      <LeadsTable leads={rows} />
      <Pagination page={page} pages={pages} href={(p) => leadsHref(status, p)} />
    </>
  );
}
