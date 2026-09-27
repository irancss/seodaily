import Link from "next/link";

import { Icon } from "@/components/atoms";
import { Flash, PageHeader } from "@/components/molecules";
import { ServicesByCategory } from "@/components/organisms/admin";
import { listCategories, listServices } from "@/modules/admin/services-queries";

export const metadata = { title: "خدمات" };

type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

export default async function ServicesAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const [categories, services] = await Promise.all([listCategories(), listServices()]);

  return (
    <>
      <PageHeader
        title="خدمات و زیرخدمات"
        description="دو خدمت اصلی صفحه اختصاصی دارند؛ هر زیرخدمت با قالب صفحه خدمات نمایش داده می‌شود."
        action={
          <Link href="/admin/services/new" className="btn btn-primary h-11 px-5 text-sm">
            <Icon name="plus" size={18} />
            زیرخدمت جدید
          </Link>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />
      <ServicesByCategory categories={categories} services={services} />
    </>
  );
}
