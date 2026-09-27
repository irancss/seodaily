import { ButtonLink, IconTile } from "@/components/atoms";
import type { Category } from "@/db/schema";
import { stepNo } from "@/lib/utils";
import { CATEGORY_UI } from "@/modules/pages/home-content";

type Props = {
  categories: Category[];
  /** Sub-service titles shown as pills, keyed by category slug. */
  tags: Record<string, string[]>;
};

export function HomeServicesIntroSection({ categories, tags }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-16">
          <h2 className="t-h2">برای رشد آنلاین، از کجا شروع کنیم؟</h2>
          <p className="body-lg">
            بسته به وضعیت فعلی کسب‌وکار، ممکن است به یک سایت جدید، بازطراحی سایت فعلی، سئو یا ترکیبی از این
            خدمات نیاز داشته باشید.
          </p>
        </div>
        <div className="mt-8 grid gap-4 lg:mt-14 lg:grid-cols-2 lg:gap-6">
          {categories.map((category, i) => {
            const ui = CATEGORY_UI[category.slug] ?? CATEGORY_UI["web-design"];
            return (
              <article key={category.slug} className="flex flex-col rounded-xl border border-line bg-page p-6 lg:p-10">
                <div className="flex items-center justify-between lg:items-start">
                  <span className="t-h2 text-brand">{stepNo(i)}</span>
                  <IconTile name={ui.icon} className="size-12 lg:size-14" />
                </div>
                <h3 className="mt-4 text-xl leading-[1.65] font-semibold lg:mt-6 lg:text-2xl lg:leading-[1.6] lg:font-bold">
                  {category.title}
                </h3>
                <p className="mt-2 text-base leading-[1.9] text-ink-2 lg:mt-3">{category.description}</p>
                {tags[category.slug]?.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2 lg:mt-6">
                    {tags[category.slug].map((t) => (
                      <li key={t} className="pill">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                <ButtonLink href={ui.href} variant="secondary" size="sm" arrow className="mt-6 lg:mt-8 lg:self-start">
                  {ui.cta}
                </ButtonLink>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
