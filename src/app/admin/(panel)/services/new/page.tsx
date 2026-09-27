import { PageHeader } from "@/components/molecules";
import { ServiceForm } from "@/components/organisms";
import { listCategories, listServiceOptions } from "@/modules/admin/services-queries";

export const metadata = { title: "زیرخدمت جدید" };

export default async function NewService() {
  const [categories, all] = await Promise.all([listCategories(), listServiceOptions()]);
  return (
    <>
      <PageHeader title="زیرخدمت جدید" back={{ href: "/admin/services", label: "خدمات" }} />
      <ServiceForm categories={categories} all={all} />
    </>
  );
}
