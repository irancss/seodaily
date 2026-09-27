import Link from "next/link";

import { Icon, JsonLd } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { FaqList } from "@/components/organisms/faq-list";
import type { Faq } from "@/db/schema";

type Props = {
  faqs: Faq[];
  /** FAQPage structured data, built by the page. */
  jsonLd: unknown;
};

export function SeoFaqSection({ faqs, jsonLd }: Props) {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading
          eyebrow="سؤال‌های متداول"
          title="سؤال‌های رایج درباره *سئو*"
          text="پاسخ‌ها کلی هستند؛ جزئیات هر پروژه بعد از بررسی سایت مشخص می‌شود."
          action={
            <Link href="/contact" className="text-link">
              سؤال دیگری دارید؟
              <Icon name="arrow-left" />
            </Link>
          }
        />
        <FaqList items={faqs} variant="numbered" className="mt-8 lg:mt-12" />
        <Link href="/contact" className="text-link mt-5 lg:hidden">
          سؤال دیگری دارید؟
          <Icon name="arrow-left" />
        </Link>
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
