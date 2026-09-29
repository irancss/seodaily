import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/atoms/json-ld";
import { BlockRenderer } from "@/components/organisms/blocks/block-renderer";
import { outline } from "@/modules/blocks/text";
import type { ArticleDraft } from "@/modules/blog/types";
import { readingMinutes } from "@/modules/blog/content";
import { entityHrefs } from "@/modules/plugins/queries";
import { getSiteUrl } from "@/modules/seo/metadata";
import { ShareButtons } from "./share-buttons";
export async function ArticleView({ data, publishedAt, modifiedAt, category, wordsPerMinute = 200, preview = false }: { data: ArticleDraft; publishedAt: Date | null; modifiedAt: Date | null; category: { title: string; slug: string } | null; wordsPerMinute?: number; preview?: boolean }) {
  const base = await getSiteUrl(), url = data.canonicalUrl || `${base}/blog/${data.slug}`;
  const toc = outline(data.content, "article-", true).filter((h) => h.level <= 3);
  const cta = { v: 1, doc: { type: "doc", content: data.endCta ? [{ type: "cta", attrs: { id: "end-cta", title: data.ctaTitle, text: data.ctaText, label: data.ctaLabel, href: data.ctaHref } }] : [] } };
  const hrefs = await entityHrefs([data.content, cta]);
  const breadcrumbs = [{ name: "خانه", url: base }, { name: "بلاگ", url: `${base}/blog` }, ...(category ? [{ name: category.title, url: `${base}/blog/${category.slug}` }] : []), { name: data.title, url }];
  return <article className="container-site py-10 lg:py-16">
    <nav aria-label="مسیر صفحه" className="mb-6 flex flex-wrap gap-2 text-sm text-muted">{breadcrumbs.map((b, i) => <span key={i}>{i > 0 && " / "}{i === breadcrumbs.length - 1 ? b.name : <Link href={b.url}>{b.name}</Link>}</span>)}</nav>
    <header className="mx-auto mb-8 max-w-4xl"><h1 className="text-3xl leading-relaxed font-bold lg:text-4xl">{data.title || "پیش‌نویس بدون عنوان"}</h1>{data.excerpt && <p className="mt-4 text-lg leading-8 text-muted">{data.excerpt}</p>}<p className="my-5 flex flex-wrap gap-4 text-sm text-muted"><span>نویسنده: سئو دیلی</span>{publishedAt && <span>انتشار: <time dateTime={publishedAt.toISOString()}>{publishedAt.toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}</time></span>}{modifiedAt && publishedAt && modifiedAt.getTime() > publishedAt.getTime() && <span>بروزرسانی: <time dateTime={modifiedAt.toISOString()}>{modifiedAt.toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}</time></span>}<span>{(data.readingOverride ?? readingMinutes(data.content, wordsPerMinute)).toLocaleString("fa-IR")} دقیقه مطالعه</span></p>{!preview && <ShareButtons url={url} title={data.title} />}</header>
    {data.image && <Image src={data.image} alt={data.imageAlt} width={data.imageWidth || 1200} height={data.imageHeight || 675} sizes="(min-width: 1024px) 896px, 100vw" priority className="mx-auto mb-10 h-auto max-h-[600px] w-full max-w-4xl rounded-xl object-contain" />}
    <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">{toc.length > 0 ? <nav aria-label="فهرست مطالب" className="rounded-xl border border-line bg-page p-5 lg:sticky lg:top-24"><h2 className="mb-3 font-bold">در این مقاله</h2><ol className="grid gap-3 text-sm">{toc.map((h) => <li className={h.level === 3 ? "ps-4" : ""} key={h.anchor}><a href={`#${h.anchor}`} className="hover:text-brand">{h.text}</a></li>)}</ol></nav> : <div />}
      <div className="min-w-0"><BlockRenderer document={data.content} hrefs={hrefs} anchorPrefix="article-" stableAnchors /><BlockRenderer document={cta} hrefs={hrefs} /></div>
    </div>
    {!preview && publishedAt && <JsonLd data={[{ "@context": "https://schema.org", "@type": "BlogPosting", "@id": `${url}#article`, mainEntityOfPage: url, headline: data.title, description: data.seoDescription || data.excerpt, image: `${base}${data.image}`, datePublished: publishedAt.toISOString(), dateModified: (modifiedAt || publishedAt).toISOString(), inLanguage: "fa-IR", author: { "@type": "Organization", name: "سئو دیلی", "@id": `${base}/#organization` }, publisher: { "@id": `${base}/#organization` } }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: b.url })) }]} />}
  </article>;
}
