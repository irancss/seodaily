import { notFound } from "next/navigation";

import { PageHeader } from "@/components/molecules";
import { LeadDetails, LeadFollowupForm } from "@/components/organisms/admin";
import { getLead } from "@/modules/admin/leads-queries";

export const metadata = { title: "جزئیات درخواست" };

type Props = { params: Promise<{ id: string }> };

export default async function LeadPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <>
      <PageHeader title={lead.name} back={{ href: "/admin/leads", label: "همه درخواست‌ها" }} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <LeadDetails lead={lead} />
        <LeadFollowupForm lead={lead} />
      </div>
    </>
  );
}
