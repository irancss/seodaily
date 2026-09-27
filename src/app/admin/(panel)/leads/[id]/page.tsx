import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { LeadDetails, LeadEstimate, LeadFollowupForm } from "@/components/organisms/admin";
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
      <PageHeader
        title={lead.name}
        back={{ href: "/admin/leads", label: "همه درخواست‌ها" }}
        action={
          <Link href={`/admin/leads/${lead.id}/contract`} className="btn btn-secondary h-11 px-5 text-sm">
            <Icon name="doc-check" size={18} />
            ساخت قرارداد
          </Link>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <LeadDetails lead={lead} />
          <LeadEstimate lead={lead} />
        </div>
        <LeadFollowupForm lead={lead} />
      </div>
    </>
  );
}
