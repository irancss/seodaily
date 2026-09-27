import { PageHeader } from "@/components/molecules";
import { AdminServiceTabs, ContractCompanyForm, ContractTemplateEditor } from "@/components/organisms/admin";
import { getContractSettings } from "@/modules/contracts/queries";
import { isPricingService } from "@/modules/pricing/types";

export const metadata = { title: "قالب قرارداد" };

type Props = { searchParams: Promise<{ service?: string; ok?: string; error?: string }> };

export default async function ContractsAdmin({ searchParams }: Props) {
  const { service: requested } = await searchParams;
  const service = isPricingService(requested) ? requested : "web-design";
  const settings = await getContractSettings();

  return (
    <>
      <PageHeader
        title="قالب قرارداد"
        description="قرارداد هر درخواست از روی این قالب‌ها ساخته می‌شود: مشخصات کارفرما و اقلام برآورد از درخواست، و مشخصات مجری از همین صفحه."
      />
      <div className="flex flex-col gap-8">
        <ContractCompanyForm company={settings.company} />
        <section aria-labelledby="contract-templates">
          <h2 id="contract-templates" className="mb-4 text-lg leading-[1.7] font-bold">
            متن قرارداد هر خدمت
          </h2>
          <AdminServiceTabs basePath="/admin/contracts" current={service} anchor="contract-templates" />
          <ContractTemplateEditor key={service} service={service} template={settings.templates[service]} customized={settings.customized[service]} />
        </section>
      </div>
    </>
  );
}
