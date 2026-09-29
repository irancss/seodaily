import { Icon } from "@/components/atoms";
import { RichText } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { cx } from "@/lib/utils";

import { toneClass, type SectionTone } from "./tone";

type Props = {
  service: Service;
  /** In-page links («در این صفحه»): the sections that follow, by anchor id. */
  contents: { id: string; label: string }[];
  tone?: SectionTone;
  siteUrl: string;
};

/** «<service> چیست؟» — the definition, with a short table of contents beside it. */
export function ServiceOverviewSection({ service, contents, tone, siteUrl }: Props) {
  return (
    <section id="service-overview" className={cx("section", toneClass(tone))}>
      <div className={cx("container-site grid items-start gap-8 lg:gap-16", contents.length > 1 && "lg:grid-cols-[minmax(0,1fr)_320px]")}>
        <div className="reveal flex max-w-[760px] flex-col items-start gap-4">
          <span className="eyebrow">معرفی خدمت</span>
          <h2 className="t-h2 text-balance">{service.title} چیست؟</h2>
          <RichText text={service.overview} siteUrl={siteUrl} />
        </div>
        {contents.length > 1 && (
          <nav aria-labelledby="service-toc" className="reveal rounded-xl border border-line bg-page p-5 lg:sticky lg:top-28 lg:p-6">
            <p id="service-toc" className="flex items-center gap-2 text-sm font-bold text-ink">
              <Icon name="list-doc" size={18} className="text-brand" />
              در این صفحه
            </p>
            <ol className="mt-3 flex flex-col">
              {contents.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex min-h-11 items-center gap-2 border-b border-line py-2 text-sm leading-[1.8] text-ink-2 no-underline last:border-0 hover:text-brand"
                  >
                    <Icon name="chevron-left" size={14} className="shrink-0 text-muted" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </section>
  );
}
