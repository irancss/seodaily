import { notFound } from "next/navigation";

import { PageHeader } from "@/components/molecules";
import { ContractDocument, ContractToolbar, PrintButton } from "@/components/organisms/admin";
import { getLead } from "@/modules/admin/leads-queries";
import { getContractSettings } from "@/modules/contracts/queries";
import { buildLeadContract } from "@/modules/contracts/render";

export const metadata = { title: "قرارداد" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ template?: string }> };

export default async function LeadContractPage({ params, searchParams }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [lead, settings, { template }] = await Promise.all([getLead(id), getContractSettings(), searchParams]);
  if (!lead) notFound();
  const contract = buildLeadContract(lead, settings, { template });

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={`قرارداد ${lead.name}`} back={{ href: `/admin/leads/${lead.id}`, label: "بازگشت به درخواست" }} action={<PrintButton />} />
        <ContractToolbar leadId={lead.id} contract={contract} settings={settings} />
      </div>
      <ContractDocument contract={contract} />
    </>
  );
}
