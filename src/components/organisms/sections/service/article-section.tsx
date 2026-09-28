import { RichText } from "@/components/molecules";
import type { ContentSection } from "@/db/schema";
import { cx } from "@/lib/utils";

import { toneClass, type SectionTone } from "./tone";

export const articleId = (i: number) => `service-topic-${i + 1}`;

/** The in-depth part of a service page: each section is its own H2 with free text. */
export function ServiceArticleSection({ sections, tone }: { sections: ContentSection[]; tone?: SectionTone }) {
  return (
    <section className={cx("section", toneClass(tone))}>
      <div className="container-site flex flex-col">
        {sections.map((section, i) => (
          <article
            key={i}
            id={articleId(i)}
            className="reveal grid gap-4 border-t border-line py-10 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16 lg:py-14"
          >
            <div className="flex items-start gap-3 lg:sticky lg:top-28 lg:self-start">
              <span aria-hidden="true" className="mt-1.5 text-sm font-bold text-brand lg:mt-2.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="t-h3 text-balance lg:text-2xl lg:leading-[1.6]">{section.title}</h2>
            </div>
            <RichText text={section.body} className="max-w-[760px]" />
          </article>
        ))}
      </div>
    </section>
  );
}
