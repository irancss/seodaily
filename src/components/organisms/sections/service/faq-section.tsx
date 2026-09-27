import { JsonLd } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { FaqList } from "@/components/organisms";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
  /** FAQPage schema built by the page; rendered inside the section. */
  jsonLd: unknown;
};

export function ServiceFaqSection({ service, jsonLd }: Props) {
  return (
    <section className="section">
      <div className="mx-auto w-full max-w-[920px] px-5">
        <SectionHeading align="center" title="سؤال‌های متداول" text={`پرسش‌های رایج درباره ${service.title}`} />
        <div className="mt-6 lg:mt-10">
          <FaqList items={service.faqs} variant="panel" />
        </div>
      </div>
      <JsonLd data={jsonLd} />
    </section>
  );
}
