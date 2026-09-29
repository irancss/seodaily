import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/modules/auth/session";
import { emptyCategory } from "@/modules/blog/types";
import { BlogCategoryForm } from "@/components/organisms/admin/blog/category-form";
import { PageHeader } from "@/components/molecules";
export default async function BlogCategoriesAdmin() {
  await requireAdmin(); const rows = await db.select().from(schema.blogCategories).where(eq(schema.blogCategories.archived, false)).orderBy(asc(schema.blogCategories.sortOrder), asc(schema.blogCategories.id));
  return <><PageHeader title="دسته‌های بلاگ" /><BlogCategoryForm key={`new-${rows.length}`} category={{ id: 0, version: 0, title: "", slug: "", sortOrder: 0, enabled: true, data: emptyCategory() }} />{rows.map((c) => <BlogCategoryForm key={`${c.id}-${c.version}`} category={c} />)}</>;
}
