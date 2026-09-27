import Link from "next/link";

import { JsonLd } from "@/components/atoms";
import { FaqList } from "@/components/organisms";
import type { Faq } from "@/db/schema";

type Props = {
  faqs: Faq[];
  /** FAQPage structured data, built by the page. */
  jsonLd: unknown;
};

export function SeoFaqSection({ faqs, jsonLd }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex max-w-[640px] flex-col gap-3">
            <h2 className="t-h2">سؤال‌های رایج درباره سئو</h2>
            <p className="body-lg">پاسخ‌ها کلی هستند؛ جزئیات هر پروژه بعد از بررسی سایت مشخص می‌شود.</p>
          </div>
          <Link href="/contact" className="text-link hidden shrink-0 lg:inline-flex">
            سؤال دیگری دارید؟
          </Link>
        </div>
        <div className="mt-6 lg:mt-10">
          <FaqList items={faqs} variant="numbered" />
        </div>
        <Link href="/contact" className="text-link mt-5 lg:hidden">
          سؤال دیگری دارید؟
        </Link>
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
