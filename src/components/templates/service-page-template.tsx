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
} from "@/components/organisms/sections/service";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
  categoryTitle: string;
  related: ComponentProps<typeof ServiceRelatedSection>["related"];
  /** FAQPage structured data, rendered inside the FAQ section. */
  faqJsonLd: unknown;
};

/** SD05 service page: every section of the shared service template, in order. */
export function ServicePageTemplate({ service, categoryTitle, related, faqJsonLd }: Props) {
  return (
    <>
      {/* 01 · hero */}
      <ServiceHeroSection service={service} categoryTitle={categoryTitle} />

      {/* 02 · problem */}
      {(service.problemIntro || service.problems.length > 0) && <ServiceProblemSection service={service} />}

      {/* 03 · includes */}
      {service.includes.length > 0 && <ServiceIncludesSection service={service} />}

      {/* 04 · process */}
      {service.process.length > 0 && <ServiceProcessSection service={service} />}

      {/* 05 · for who */}
      {(service.forWhoIntro || service.situations.length > 0 || service.businessTypes.length > 0) && (
        <ServiceForWhoSection service={service} />
      )}

      {/* 06 · deliverables */}
      {service.deliverables.length > 0 && <ServiceDeliverablesSection service={service} />}

      {/* 07 · related */}
      {related.length > 0 && <ServiceRelatedSection related={related} />}

      {/* 08 · faq */}
      {service.faqs.length > 0 && <ServiceFaqSection service={service} jsonLd={faqJsonLd} />}

      {/* 09 · cta */}
      <ServiceCtaSection service={service} />
    </>
  );
}
