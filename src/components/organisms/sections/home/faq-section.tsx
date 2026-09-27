import Link from "next/link";

import { Icon, JsonLd, PhoneLink } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { FaqList } from "@/components/organisms/faq-list";
import type { Faq } from "@/db/schema";

type Props = {
  faqs: Faq[];
  /** FAQPage structured data, built by the page. */
  jsonLd: unknown;
  phone: string;
};

export function HomeFaqSection({ faqs, jsonLd, phone }: Props) {
  return (
    <section className="section">
      <div className="container-site grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
          <SectionHeading
            align="stack"
            eyebrow="سؤال‌های متداول"
            title="پاسخ *سؤال‌های* رایج"
            text="اگر پاسخ سؤالتان در این فهرست نیست، آن را همراه با درخواست مشاوره برای ما بفرستید."
          />
          <div className="reveal rounded-xl border border-line bg-white p-5 shadow-sm lg:p-6">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="icon-gradient size-11 rounded-full">
                <Icon name="message" size={20} />
              </span>
              <div>
                <p className="font-bold">سؤال دیگری دارید؟</p>
                <p className="text-sm leading-[1.8] text-muted">مستقیم با ما در تماس باشید.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              {phone && <PhoneLink phone={phone} className="btn btn-secondary h-12 px-5" />}
              <Link href="/contact" className="text-link justify-center">
                ارسال سؤال از طریق فرم مشاوره
              </Link>
            </div>
          </div>
        </div>
        <FaqList items={faqs} />
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
