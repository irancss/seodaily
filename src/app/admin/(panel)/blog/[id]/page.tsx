import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/modules/auth/session";
import { ArticleForm } from "@/components/organisms/admin/blog/article-form";
import { Card, PageHeader } from "@/components/molecules";
import { blogOptions } from "@/modules/blog/queries";
import { auditArticleLinks } from "@/modules/blog/link-audit";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const id = Number((await params).id); if (!Number.isSafeInteger(id)) notFound();
  const [row] = await db.select().from(schema.articles).where(eq(schema.articles.id, id)); if (!row) notFound();
  const [categories, services, articles, options, incoming, revisions, outgoing] = await Promise.all([
    db.select().from(schema.blogCategories).where(eq(schema.blogCategories.archived, false)),
    db.select({ id: schema.services.id, title: schema.services.title }).from(schema.services).where(eq(schema.services.published, true)),
    db.select({ id: schema.articles.id, title: sql<string>`${schema.articles.published}->>'title'` }).from(schema.articles).where(eq(schema.articles.status, "published")).orderBy(desc(schema.articles.publishedAt)).limit(200), blogOptions(),
    db.select({ title: sql<string>`${schema.articles.published}->>'title'`, updatedAt: schema.articleLinks.updatedAt }).from(schema.articleLinks).innerJoin(schema.articles, eq(schema.articleLinks.articleId, schema.articles.id)).where(and(eq(schema.articleLinks.href, `entity:article:${id}`), eq(schema.articles.status, "published"))).limit(100),
    db.select({ kind: schema.articleRevisions.kind, createdAt: schema.articleRevisions.createdAt, version: schema.articleRevisions.version }).from(schema.articleRevisions).where(eq(schema.articleRevisions.articleId, id)).orderBy(desc(schema.articleRevisions.id)).limit(20), auditArticleLinks(row.draft),
  ]);
  return <><PageHeader title={row.draft.title || "مقاله جدید"} /><ArticleForm id={id} initial={row.draft} version={row.version} status={row.status} categories={categories} services={services} articles={articles} wordsPerMinute={options.wordsPerMinute} scheduledFor={row.scheduledFor?.toISOString() ?? null} scheduleError={row.scheduleError} />
    <Card title="بررسی لینک‌های محتوایی"><p className="mb-3 text-sm text-muted">ورودی‌ها از آخرین نسخه منتشرشده مقاله‌ها؛ خروجی‌ها از پیش‌نویس ذخیره‌شده. منو، فوتر و کارت مرتبط در این شمارش نیستند.</p><p className="text-sm">{incoming.length ? `${incoming.length} لینک محتوایی ورودی` : "بدون لینک محتوایی ورودی از مقاله‌های منتشرشده"}</p><ul className="my-3 text-sm">{incoming.map((l, i) => <li key={i}>{l.title} · نمایه: {l.updatedAt.toLocaleDateString("fa-IR")}</li>)}</ul><ul className="grid gap-2 text-sm">{outgoing.map((l, i) => <li key={i} className="break-all">{l.href} - {l.resolved || "?"} {l.warning}</li>)}</ul></Card>
    <Card title="تاریخچه ذخیره و انتشار"><ul className="grid gap-2 text-sm">{revisions.map((r, i) => <li key={i}>نسخه {r.version} · {r.kind} · {r.createdAt.toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}</li>)}</ul></Card>
  </>;
}
