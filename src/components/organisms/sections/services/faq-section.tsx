import Link from "next/link";

import { Icon, JsonLd } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { FaqList } from "@/components/organisms/faq-list";
import type { Faq } from "@/db/schema";
import { vars } from "@/lib/utils";

type Props = {
  faqs: Faq[];
  /** FAQPage structured data, built by the page. */
  jsonLd: unknown;
};

export function ServicesFaqSection({ faqs, jsonLd }: Props) {
  return (
    <section className="section">
      <div className="container-site grid items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
          <SectionHeading
            align="stack"
            eyebrow="پرسش و پاسخ"
            title="سؤال‌های *متداول*"
            text="پاسخ چند سؤال رایج درباره انتخاب و ترکیب خدمات."
          />
          <div className="surface-dark reveal overflow-hidden rounded-xl p-5 lg:p-6">
            <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "28px" })} />
            <span aria-hidden="true" className="orb orb-blue -top-32 -left-24 size-[280px]" />
            <span aria-hidden="true" className="icon-gradient size-11 rounded-full">
              <Icon name="message" size={20} />
            </span>
            <Link
              href="/contact"
              className="mt-4 flex items-center justify-between gap-3 text-base leading-[1.8] font-semibold text-white no-underline hover:text-cyan-200"
            >
              سؤال دیگری دارید؟ آن را در فرم مشاوره بنویسید
              <Icon name="arrow-left" size={18} className="shrink-0" />
            </Link>
          </div>
        </div>
        <FaqList items={faqs} />
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
