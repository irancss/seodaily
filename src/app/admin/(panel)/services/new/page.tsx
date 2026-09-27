import { asc } from "drizzle-orm";

import { Flash, PageHeader } from "@/components/molecules";
import { db, schema } from "@/db";

import { ServiceForm } from "@/components/organisms";

export const metadata = { title: "زیرخدمت جدید" };

export default async function NewService({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [sp, categories, all] = await Promise.all([
    searchParams,
    db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
    db.select({ slug: schema.services.slug, title: schema.services.title }).from(schema.services),
  ]);
  return (
    <>
      <PageHeader title="زیرخدمت جدید" back={{ href: "/admin/services", label: "خدمات" }} />
      <Flash error={sp.error} />
      <ServiceForm categories={categories} all={all} />
    </>
  );
}
