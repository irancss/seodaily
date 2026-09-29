import Link from "next/link";

import { Icon } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { AdminServiceTabs, PricingEditor } from "@/components/organisms/admin";
import { getPricing } from "@/modules/pricing/queries";
import { isPricingService } from "@/modules/pricing/types";
import { pricingHref, pricingPageKey } from "@/modules/pricing/routes";

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
        description="بسته‌های قیمت، توضیحات و جدول‌های هر خدمت در صفحهٔ مستقل آن نمایش داده می‌شود. می‌توانید مثلاً سه بستهٔ سئو بسازید و برای هرکدام قیمت، دورهٔ پرداخت، توضیح و امکانات بنویسید."
        action={
          <Link href={pricingHref(service)} target="_blank" className="btn btn-secondary h-11 px-5 text-sm">
            مشاهده صفحه تعرفه‌ها
            <Icon name="external" size={16} />
          </Link>
        }
      />
      <AdminServiceTabs basePath="/admin/pricing" current={service} />
      <p className="mb-6 text-sm leading-8 text-ink-2">برای تغییر عنوان اصلی و مشخصات سئو، <Link href={`/admin/pages?open=${pricingPageKey(service)}`} className="font-medium text-brand-hover underline underline-offset-4">متن و سئوی همین صفحه</Link> را ویرایش کنید.</p>
      <PricingEditor key={service} service={service} initial={pricing[service]} />
    </>
  );
}
