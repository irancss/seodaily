import Link from "next/link";

import { JsonLd } from "@/components/atoms";
import { FaqList } from "@/components/organisms";
import type { Faq } from "@/db/schema";

type Props = {
  faqs: Faq[];
  /** FAQPage structured data, built by the page. */
  jsonLd: unknown;
};

export function HomeFaqSection({ faqs, jsonLd }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-24">
        <div className="flex flex-col gap-3 lg:gap-4">
          <h2 className="t-h2">سؤال‌های متداول</h2>
          <p className="body-lg">اگر پاسخ سؤالتان در این فهرست نیست، آن را همراه با درخواست مشاوره برای ما بفرستید.</p>
          <Link href="/contact" className="text-link self-start">
            ارسال سؤال از طریق فرم مشاوره
          </Link>
        </div>
        <FaqList items={faqs} />
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
