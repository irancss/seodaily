import { ButtonLink } from "@/components/atoms";
import { FormSketch } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function ServicesCtaSection({ text }: Props) {
  return (
    <section className="flex grow items-center pb-16 lg:pb-24">
      <div className="container-site">
        <div className="grid items-center gap-6 rounded-xl border border-line bg-white p-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:rounded-2xl lg:px-16 lg:py-14">
          <div className="flex flex-col items-start">
            <h2 className="t-h2">{text.ctaTitle}</h2>
            <p className="body-lg mt-3 lg:mt-4">{text.ctaText}</p>
            <ButtonLink href="/contact" size="lg" arrow className="mt-6 w-full sm:w-auto lg:mt-8">
              درخواست مشاوره
            </ButtonLink>
          </div>
          <div className="order-first lg:order-none">
            <FormSketch />
          </div>
        </div>
      </div>
    </section>
  );
}
