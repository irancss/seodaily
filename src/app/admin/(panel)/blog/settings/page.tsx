import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/modules/auth/session";
import { blogOptions } from "@/modules/blog/queries";
import { BlogOptionsForm } from "@/components/organisms/admin/blog/options-form";
import { Card, PageHeader } from "@/components/molecules";
export default async function BlogSettings() {
  await requireAdmin(); const [options, articles] = await Promise.all([blogOptions(), db.select({ id: schema.articles.id, title: sql<string>`${schema.articles.published}->>'title'` }).from(schema.articles).where(eq(schema.articles.status, "published")).limit(500)]);
  return <><PageHeader title="تنظیمات بلاگ" /><Card><BlogOptionsForm options={options} articles={articles} /></Card></>;
}
