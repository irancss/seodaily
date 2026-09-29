import Image from "next/image";
import Link from "next/link";
import type { ArticleCard as CardData } from "@/modules/blog/queries";
export function ArticleCard({ article, featured = false, wordsPerMinute = 200 }: { article: CardData; featured?: boolean; wordsPerMinute?: number }) {
  const d = article.data;
  return <article className={`group h-full overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md ${featured ? "grid md:grid-cols-2" : "flex flex-col"}`}>
    <Link href={`/blog/${article.slug}`} tabIndex={-1} aria-hidden="true" className="relative block aspect-video overflow-hidden bg-soft"><Image src={d.image} alt="" fill sizes={featured ? "(min-width: 768px) 600px, 100vw" : "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 85vw"} className="object-contain transition-transform group-hover:scale-[1.02]" /></Link>
    <div className="flex flex-col gap-3 p-5"><Link className="text-xs font-semibold text-brand" href={`/blog/${article.categorySlug}`}>{article.categoryTitle}</Link><h2 className={`${featured ? "text-2xl" : "text-lg"} leading-relaxed font-bold`}><Link href={`/blog/${article.slug}`}>{d.title}</Link></h2>{featured && <p className="text-sm leading-7 text-muted">{d.excerpt}</p>}<p className="mt-auto flex flex-wrap gap-3 text-xs text-muted"><time dateTime={article.publishedAt?.toISOString()}>{article.publishedAt?.toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}</time><span>{(d.readingOverride ?? Math.max(1, Math.ceil((d.wordCount || 0) / wordsPerMinute))).toLocaleString("fa-IR")} دقیقه مطالعه</span></p></div>
  </article>;
}
