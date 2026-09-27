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

export function WebDesignFaqSection({ faqs, jsonLd }: Props) {
  return (
    <section className="section bg-white">
      <div className="mx-auto w-full max-w-[840px] px-5">
        <SectionHeading
          align="center"
          title="سؤال‌های متداول طراحی سایت"
          text={
            <>
              اگر پاسخ سؤالتان اینجا نیست، آن را همراه با{" "}
              <Link href="/contact" className="font-semibold underline-offset-[6px]">
                درخواست مشاوره
              </Link>{" "}
              بفرستید.
            </>
          }
        />
        <div className="mt-6 lg:mt-12">
          <FaqList items={faqs} />
        </div>
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
