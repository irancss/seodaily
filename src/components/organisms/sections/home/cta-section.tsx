import { ButtonLink } from "@/components/atoms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function HomeCtaSection({ text }: Props) {
  return (
    <section className="flex grow items-center py-16 lg:py-24">
      <div className="container-site">
        <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-xl border border-line bg-soft px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:rounded-2xl lg:p-16">
          <div
            aria-hidden="true"
            className="grid-bg absolute inset-y-0 left-0 hidden w-[420px] lg:block"
            style={{ ["--grid" as string]: "32px", maskImage: "linear-gradient(270deg, transparent 0%, #000 100%)" }}
          />
          <div className="relative flex max-w-[680px] flex-col gap-3 lg:gap-4">
            <h2 className="t-h2">{text.ctaTitle}</h2>
            <p className="body-lg">{text.ctaText}</p>
          </div>
          <ButtonLink href="/contact" size="lg" arrow className="relative w-full shrink-0 sm:w-auto">
            درخواست مشاوره
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
