import Link from "next/link";

import { Icon, JsonLd } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { FaqList } from "@/components/organisms";
import type { Service } from "@/db/schema";
import { cx } from "@/lib/utils";

import { toneClass, type SectionTone } from "./tone";

type Props = {
  service: Service;
  /** FAQPage schema built by the page; rendered inside the section. */
  jsonLd: unknown;
  tone?: SectionTone;
};

export function ServiceFaqSection({ service, jsonLd, tone }: Props) {
  return (
    <section className={cx("section", toneClass(tone))}>
      <div className="container-site grid items-start gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
          <SectionHeading
            align="stack"
            eyebrow="پرسش و پاسخ"
            title="سؤال‌های *متداول*"
            text={`پرسش‌های رایج درباره ${service.title}`}
          />
          <div className="surface-soft-gradient reveal hidden items-center gap-4 rounded-xl border border-line p-5 lg:flex">
            <span aria-hidden="true" className="icon-gradient size-11 rounded-full">
              <Icon name="message" size={20} />
            </span>
            <div className="flex flex-col">
              <p className="font-bold">سؤال دیگری دارید؟</p>
              <Link href="/contact" className="text-sm leading-[1.8] font-semibold underline-offset-4 hover:underline">
                ارسال سؤال از طریق فرم مشاوره
              </Link>
            </div>
          </div>
        </div>
        <FaqList items={service.faqs} />
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
