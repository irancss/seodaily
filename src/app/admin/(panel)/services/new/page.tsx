import { Flash, PageHeader } from "@/components/molecules";
import { ServiceForm } from "@/components/organisms";
import { listCategories, listServiceOptions } from "@/modules/admin/services-queries";

export const metadata = { title: "زیرخدمت جدید" };

export default async function NewService({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [sp, categories, all] = await Promise.all([searchParams, listCategories(), listServiceOptions()]);
  return (
    <>
      <PageHeader title="زیرخدمت جدید" back={{ href: "/admin/services", label: "خدمات" }} />
      <Flash error={sp.error} />
      <ServiceForm categories={categories} all={all} />
    </>
  );
}
