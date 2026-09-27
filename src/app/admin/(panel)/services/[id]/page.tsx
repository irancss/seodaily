import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/molecules";
import { ServiceForm } from "@/components/organisms";
import { getService, listCategories, listServiceOptions } from "@/modules/admin/services-queries";
import { serviceHref } from "@/modules/services/routes";

export const metadata = { title: "ویرایش خدمت" };

type Props = { params: Promise<{ id: string }> };

export default async function EditService({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [service, categories, all] = await Promise.all([getService(id), listCategories(), listServiceOptions()]);
  if (!service) notFound();
  return (
    <>
      <PageHeader
        title={service.title}
        back={{ href: "/admin/services", label: "خدمات" }}
        action={service.published ? <Link href={serviceHref(service.slug)} target="_blank" className="btn btn-secondary h-11 px-5 text-sm">مشاهده صفحه</Link> : undefined}
      />
      <ServiceForm service={service} categories={categories} all={all} />
    </>
  );
}
