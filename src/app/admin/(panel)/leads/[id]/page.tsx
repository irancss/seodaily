import { notFound } from "next/navigation";

import { Flash, PageHeader } from "@/components/molecules";
import { LeadDetails, LeadFollowupForm } from "@/components/organisms/admin";
import { getLead } from "@/modules/admin/leads-queries";

export const metadata = { title: "جزئیات درخواست" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> };

export default async function LeadPage({ params, searchParams }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const lead = await getLead(id);
  if (!lead) notFound();
  const sp = await searchParams;

  return (
    <>
      <PageHeader title={lead.name} back={{ href: "/admin/leads", label: "همه درخواست‌ها" }} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <LeadDetails lead={lead} />
        <LeadFollowupForm lead={lead} />
      </div>
    </>
  );
}
