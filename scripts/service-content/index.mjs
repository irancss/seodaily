// Service page content (version 2): the text of every section of each
// /services/<slug> page. New installs are seeded with it; existing installs
// get it through the upgrade step in seed.mjs, which only touches services
// that were never edited in the admin panel.
import { content as seo1 } from "./seo-1.mjs";
import { content as seo2 } from "./seo-2.mjs";
import { content as webDesign } from "./web-design.mjs";

export const SERVICE_CONTENT_VERSION = 2;

/** slug → page content (the `mapping` key is documentation only and never stored). */
export const serviceContent = { ...webDesign, ...seo1, ...seo2 };

/** The columns of the services table that the content fills. */
export function contentColumns(c) {
  return {
    summary: c.summary,
    hero_description: c.heroDescription,
    overview: c.overview,
    sections: c.sections,
    problem_intro: c.problemIntro,
    problems: c.problems,
    includes_intro: c.includesIntro,
    includes: c.includes,
    process: c.process,
    for_who_intro: c.forWhoIntro,
    situations: c.situations,
    business_types: c.businessTypes,
    deliverables_intro: c.deliverablesIntro,
    deliverables: c.deliverables,
    faqs: c.faqs,
    related_slugs: c.relatedSlugs,
    meta_title: c.metaTitle,
    meta_description: c.metaDescription,
  };
}
