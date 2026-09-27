import type { ComponentProps } from "react";

import {
  ServiceCtaSection,
  ServiceDeliverablesSection,
  ServiceFaqSection,
  ServiceForWhoSection,
  ServiceHeroSection,
  ServiceIncludesSection,
  ServiceProblemSection,
  ServiceProcessSection,
  ServiceRelatedSection,
  type SectionTone,
} from "@/components/organisms/sections/service";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
  categoryTitle: string;
  related: ComponentProps<typeof ServiceRelatedSection>["related"];
  /** FAQPage structured data, rendered inside the FAQ section. */
  faqJsonLd: unknown;
  /** Site phone for the closing call-to-action. */
  phone: string;
};

const ORDER = ["problem", "includes", "process", "forWho", "deliverables", "faq", "related"] as const;
type Block = (typeof ORDER)[number];

/** SD05 service page: every section of the shared service template, in order. */
export function ServicePageTemplate({ service, categoryTitle, related, faqJsonLd, phone }: Props) {
  const present: Record<Block, boolean> = {
    problem: Boolean(service.problemIntro || service.problems.length > 0),
    includes: service.includes.length > 0,
    process: service.process.length > 0,
    forWho: Boolean(service.forWhoIntro || service.situations.length > 0 || service.businessTypes.length > 0),
    deliverables: service.deliverables.length > 0,
    faq: service.faqs.length > 0,
    related: related.length > 0,
  };

  // Light sections alternate white / page colour in the order they render (the
  // process keeps its soft gradient), so neighbours never blend together.
  const shown = ORDER.filter((block) => present[block]);
  const tone: Partial<Record<Block, SectionTone>> = {};
  shown
    .filter((block) => block !== "process")
    .forEach((block, i) => {
      tone[block] = i % 2 === 0 ? "white" : "page";
    });
  const last = shown.at(-1);
  // The CTA panel sits on the page colour; it needs its own top spacing unless the section above shares it.
  const ctaPadTop = !last || last === "process" || tone[last] === "white";

  return (
    <>
      {/* 01 · hero */}
      <ServiceHeroSection service={service} categoryTitle={categoryTitle} />

      {/* 02 · problem */}
      {present.problem && <ServiceProblemSection service={service} tone={tone.problem} />}

      {/* 03 · includes */}
      {present.includes && <ServiceIncludesSection service={service} tone={tone.includes} />}

      {/* 04 · process */}
      {present.process && <ServiceProcessSection service={service} />}

      {/* 05 · for who */}
      {present.forWho && <ServiceForWhoSection service={service} tone={tone.forWho} />}

      {/* 06 · deliverables */}
      {present.deliverables && <ServiceDeliverablesSection service={service} tone={tone.deliverables} />}

      {/* 07 · faq */}
      {present.faq && <ServiceFaqSection service={service} jsonLd={faqJsonLd} tone={tone.faq} />}

      {/* 08 · related */}
      {present.related && <ServiceRelatedSection related={related} tone={tone.related} />}

      {/* 09 · cta */}
      <ServiceCtaSection service={service} padTop={ctaPadTop} phone={phone} />
    </>
  );
}
