import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listArticles, publicCategories } from "@/modules/blog/queries";
import { ArticleCard } from "./article-card";
export function pageNumber(value?: string) { if (!value) return 1; if (!/^[1-9]\d{0,5}$/.test(value)) notFound(); return Number(value); }
export async function BlogList({ params, category }: { params: Record<string, string | undefined>; category?: Awaited<ReturnType<typeof publicCategories>>[number] }) {
  const page = pageNumber(params.page), query = String(params.q || "").trim().slice(0, 100), path = category ? `/blog/${category.slug}` : "/blog";
  if (params.page === "1") redirect(`${path}${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  const [result, categories] = await Promise.all([listArticles({ page, query, categoryId: category?.id }), publicCategories()]);
  if (page > result.pages) notFound();
  const href = (n: number) => `${path}${n > 1 || query ? `?${new URLSearchParams({ ...(n > 1 ? { page: String(n) } : {}), ...(query ? { q: query } : {}) })}` : ""}`;
  return <div className="container-site py-10 lg:py-16"><nav aria-label="مسیر صفحه" className="mb-5 text-sm text-muted"><Link href="/">خانه</Link> / <Link href="/blog">بلاگ</Link>{category && ` / ${category.title}`}</nav><h1 className="text-3xl leading-relaxed font-bold">{category ? category.data.h1 || category.title : "بلاگ سئو دیلی"}</h1>{category?.data.description && <p className="mt-4 max-w-3xl whitespace-pre-line text-muted">{category.data.description}</p>}{category?.data.image && <Image src={category.data.image} alt={category.data.imageAlt} width={1200} height={630} className="my-6 h-auto max-h-64 w-full object-contain" />}
    <form action={path} className="my-6 flex gap-3"><label className="sr-only" htmlFor="blog-search">جست‌وجوی بلاگ</label><input id="blog-search" name="q" defaultValue={query} maxLength={100} className="field max-w-md" placeholder="جست‌وجوی مقاله…" /><button className="btn btn-primary px-5">جست‌وجو</button></form>
    <nav aria-label="دسته‌های بلاگ" className="mb-8 flex flex-wrap gap-3"><Link href="/blog" className="btn btn-secondary min-h-10 px-4 text-sm">همه مقاله‌ها</Link>{categories.map((c) => <Link href={`/blog/${c.slug}`} className="btn btn-secondary min-h-10 px-4 text-sm" key={c.id}>{c.title}</Link>)}</nav>
    {query && <p className="mb-6 text-muted">{result.total.toLocaleString("fa-IR")} نتیجه برای «{query}»</p>}
    {result.featured && <div className="mb-8"><ArticleCard article={result.featured} featured wordsPerMinute={result.options.wordsPerMinute} /></div>}
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{result.items.filter((a) => a.id !== result.featured?.id).map((a) => <ArticleCard article={a} key={a.id} wordsPerMinute={result.options.wordsPerMinute} />)}</div>
    {!result.total && <p className="rounded-xl border border-line bg-page p-8 text-muted">{query ? "مقاله‌ای با این عبارت پیدا نشد." : "هنوز مقاله‌ای منتشر نشده است."}</p>}
    <nav aria-label="صفحه‌بندی بلاگ" className="mt-8 flex items-center justify-center gap-5">{page > 1 && <Link className="btn btn-secondary h-11 px-5" href={href(page - 1)}>صفحه قبل</Link>}<span className="text-sm">صفحه {page.toLocaleString("fa-IR")} از {result.pages.toLocaleString("fa-IR")}</span>{page < result.pages && <Link className="btn btn-secondary h-11 px-5" href={href(page + 1)}>صفحه بعد</Link>}</nav>
  </div>;
}
