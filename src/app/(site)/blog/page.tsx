import { BlogList, pageNumber } from "@/components/organisms/blog/blog-list";
import { blogMetadata } from "@/modules/blog/seo";
import { emptySeo } from "@/modules/blog/types";
import { listArticles } from "@/modules/blog/queries";
export const dynamic = "force-dynamic";
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams, page = pageNumber(p.page), result = await listArticles({ page, query: p.q });
  return blogMetadata(emptySeo(), page > 1 ? `بلاگ سئو دیلی — صفحه ${page}` : "بلاگ سئو دیلی", "مقاله‌های سئو دیلی درباره طراحی سایت، سئو و خدمات مرتبط.", `/blog${page > 1 ? `?page=${page}` : ""}`, "", false, !!p.q || !result.total);
}
export default async function BlogIndex({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) { return <BlogList params={await searchParams} />; }
