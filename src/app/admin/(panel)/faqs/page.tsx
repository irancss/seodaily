import { Flash, PageHeader } from "@/components/molecules";
import { FaqEditor, FaqPageTabs } from "@/components/organisms/admin";
import { FAQ_PAGES, type FaqPage } from "@/db/schema";
import { listFaqs } from "@/modules/admin/faqs-queries";

export const metadata = { title: "سؤال‌های متداول" };

type Props = { searchParams: Promise<{ page?: string; ok?: string; error?: string }> };

export default async function FaqsAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const page = FAQ_PAGES.includes(sp.page as FaqPage) ? (sp.page as FaqPage) : "home";
  const items = await listFaqs(page);
  const nextOrder = (items.at(-1)?.sortOrder ?? 0) + 1;

  return (
    <>
      <PageHeader title="سؤال‌های متداول" description="سؤال‌های هر صفحه؛ سؤال‌های هر زیرخدمت داخل فرم همان خدمت ویرایش می‌شوند. این سؤال‌ها با اسکیمای FAQPage برای گوگل هم ارسال می‌شوند." />
      <Flash ok={sp.ok} error={sp.error} />
      <FaqPageTabs current={page} />

      <div className="flex flex-col gap-4">
        {items.map((f) => (
          <FaqEditor key={f.id} page={page} faq={f} />
        ))}

        <FaqEditor page={page} nextOrder={nextOrder} />
      </div>
    </>
  );
}
