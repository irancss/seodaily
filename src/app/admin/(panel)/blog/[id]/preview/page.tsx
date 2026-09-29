import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/modules/auth/session";
import { ArticleView } from "@/components/organisms/blog/article-view";
import { blogOptions } from "@/modules/blog/queries";
export const dynamic = "force-dynamic";
export const metadata = { title: "پیش‌نمایش خصوصی مقاله", robots: { index: false, follow: false } };
export default async function ArticlePreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const id = Number((await params).id); if (!Number.isSafeInteger(id)) notFound();
  const [a] = await db.select().from(schema.articles).where(eq(schema.articles.id, id)); if (!a) notFound();
  const [category] = a.draft.categoryId ? await db.select().from(schema.blogCategories).where(eq(schema.blogCategories.id, a.draft.categoryId)) : [];
  return <><p className="rounded-md bg-warning-bg p-4 text-warning">پیش‌نمایش خصوصی پیش‌نویس؛ این نسخه برای کاربران عمومی قابل مشاهده نیست.</p><ArticleView data={a.draft} category={category ?? null} publishedAt={a.publishedAt} modifiedAt={a.contentModifiedAt} wordsPerMinute={(await blogOptions()).wordsPerMinute} preview /></>;
}
