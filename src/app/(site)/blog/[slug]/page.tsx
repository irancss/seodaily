import { notFound, permanentRedirect } from "next/navigation";
import { blogRoute } from "@/modules/blog/routes";
import { articleById, blogOptions, publicCategories, relatedArticles } from "@/modules/blog/queries";
import { blogMetadata } from "@/modules/blog/seo";
import { ArticleView } from "@/components/organisms/blog/article-view";
import { ArticleCard } from "@/components/organisms/blog/article-card";
import { BlogList, pageNumber } from "@/components/organisms/blog/blog-list";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };
export async function generateMetadata({ params, searchParams }: Props) {
  const route = await blogRoute((await params).slug); if (!route) notFound();
  if (route.type === "article") { const a = await articleById(route.id); if (!a) notFound(); return blogMetadata(a.data, a.data.title, a.data.excerpt, `/blog/${a.slug}`, a.data.image, true); }
  const c = (await publicCategories()).find((c) => c.id === route.id); if (!c) notFound();
  const p = await searchParams, page = pageNumber(p.page);
  return blogMetadata({ ...c.data, canonicalUrl: page > 1 ? "" : c.data.canonicalUrl }, `${c.data.h1 || c.title}${page > 1 ? ` — صفحه ${page}` : ""}`, c.data.description, `/blog/${c.slug}${page > 1 ? `?page=${page}` : ""}`, c.data.image, false, !!p.q || !c.total);
}
export default async function BlogDetail({ params, searchParams }: Props) {
  const route = await blogRoute((await params).slug); if (!route) notFound();
  if (route.redirect) permanentRedirect(`/blog/${route.slug}`);
  if (route.type === "blog_category") { const c = (await publicCategories()).find((c) => c.id === route.id); if (!c) notFound(); return <BlogList category={c} params={await searchParams} />; }
  const a = await articleById(route.id); if (!a) notFound();
  const options = await blogOptions(), related = await relatedArticles(a, options.relatedCount);
  return <><ArticleView data={a.data} category={{ title: a.categoryTitle, slug: a.categorySlug }} publishedAt={a.publishedAt} modifiedAt={a.modifiedAt} wordsPerMinute={options.wordsPerMinute} />{related.length > 0 && <section className="container-site pb-16" aria-labelledby="related-title"><h2 id="related-title" className="mb-6 text-2xl font-bold">مقاله‌های مرتبط</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((r) => <ArticleCard article={r} key={r.id} wordsPerMinute={options.wordsPerMinute} />)}</div></section>}</>;
}
