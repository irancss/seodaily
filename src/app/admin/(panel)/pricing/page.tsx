import Link from "next/link";

import { Icon } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { AdminServiceTabs, PricingEditor } from "@/components/organisms/admin";
import { getPricing } from "@/modules/pricing/queries";
import { isPricingService } from "@/modules/pricing/types";

export const metadata = { title: "تعرفه و ماشین‌حساب" };

type Props = { searchParams: Promise<{ service?: string; ok?: string; error?: string }> };

export default async function PricingAdmin({ searchParams }: Props) {
  const { service: requested } = await searchParams;
  const service = isPricingService(requested) ? requested : "web-design";
  const pricing = await getPricing();

  return (
    <>
      <PageHeader
        title="تعرفه و ماشین‌حساب"
        description="پلن‌ها و گزینه‌های ماشین‌حساب صفحه تعرفه‌ها برای هر خدمت. بازدیدکننده گزینه‌ها را انتخاب می‌کند، جمع هزینه را می‌بیند و درخواستش همراه برآورد در «درخواست‌های مشاوره» ثبت می‌شود."
        action={
          <Link href={`/pricing?service=${service}`} target="_blank" className="btn btn-secondary h-11 px-5 text-sm">
            مشاهده صفحه تعرفه‌ها
            <Icon name="external" size={16} />
          </Link>
        }
      />
      <AdminServiceTabs basePath="/admin/pricing" current={service} />
      <PricingEditor key={service} service={service} initial={pricing[service]} />
    </>
  );
}
