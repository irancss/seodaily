import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmButton } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { CategoryForm } from "@/components/organisms/admin/plugins/category-form";
import type { BlockDocument } from "@/modules/blocks/schema";
import { deleteCategoryAction } from "@/modules/plugins/actions";
import { getCategoryAdmin } from "@/modules/plugins/admin-queries";

export const metadata = { title: "ویرایش دسته" };

export default async function EditPluginCategory({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const c = await getCategoryAdmin(id);
  if (!c) notFound();
  return (
    <>
      <PageHeader
        title={c.title}
        back={{ href: "/admin/plugins/categories", label: "دسته‌ها" }}
        action={
          c.published ? (
            <Link href={`/plugins/${c.slug}`} target="_blank" className="btn btn-secondary h-11 px-5 text-sm">
              مشاهده صفحه
            </Link>
          ) : undefined
        }
      />
      <CategoryForm category={{ ...c, description: c.description as BlockDocument | null }} />
      <form action={deleteCategoryAction} method="post" className="mt-6">
        <input type="hidden" name="id" value={id} />
        <ConfirmButton message="این دسته حذف شود؟ (دسته دارای افزونه حذف نمی‌شود.)">حذف دسته</ConfirmButton>
      </form>
    </>
  );
}
