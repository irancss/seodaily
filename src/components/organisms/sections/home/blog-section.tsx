import Link from "next/link";
import { latestArticles, blogOptions } from "@/modules/blog/queries";
import { ArticleCard } from "@/components/organisms/blog/article-card";
import { BlogCarousel } from "@/components/organisms/blog/blog-carousel";
export async function HomeBlogSection() {
  const [articles, options] = await Promise.all([latestArticles(8), blogOptions()]);
  if (!articles.length) return null;
  return <section className="section-pad bg-page" aria-labelledby="home-blog-title"><div className="container-site"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><h2 id="home-blog-title" className="text-2xl font-bold lg:text-3xl">آخرین مقاله‌های سئو دیلی</h2><Link className="text-brand hover:underline" href="/blog">مشاهده همه مقالات</Link></div><BlogCarousel interval={options.autoplayMs}>{articles.map((article) => <div key={article.id} className="min-w-0 snap-start"><ArticleCard article={article} wordsPerMinute={options.wordsPerMinute} /></div>)}</BlogCarousel></div></section>;
}
