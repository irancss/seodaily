import Link from "next/link";

import { JsonLd } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { FaqList } from "@/components/organisms";
import type { Faq } from "@/db/schema";

type Props = {
  faqs: Faq[];
  /** FAQPage structured data, built by the page. */
  jsonLd: unknown;
};

export function ServicesFaqSection({ faqs, jsonLd }: Props) {
  return (
    <section className="section">
      <div className="mx-auto w-full max-w-[840px] px-5">
        <SectionHeading align="center" title="سؤال‌های متداول" text="پاسخ چند سؤال رایج درباره انتخاب و ترکیب خدمات." />
        <div className="mt-6 lg:mt-12">
          <FaqList items={faqs} variant="boxed" />
        </div>
        <div className="mt-6 flex lg:mt-8 lg:justify-center">
          <Link href="/contact" className="text-link lg:text-center">
            سؤال دیگری دارید؟ آن را در فرم مشاوره بنویسید
          </Link>
        </div>
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
