import { PageHeader } from "@/components/molecules";
import { CategoryForm } from "@/components/organisms/admin/plugins/category-form";

export const metadata = { title: "دسته جدید" };

export default function NewPluginCategory() {
  return (
    <>
      <PageHeader title="دسته جدید" back={{ href: "/admin/plugins/categories", label: "دسته‌ها" }} />
      <CategoryForm category={{ id: null, title: "", slug: "", h1: "", description: null, seoTitle: "", seoDescription: "", imageUrl: "", sortOrder: 0, published: true }} />
    </>
  );
}
