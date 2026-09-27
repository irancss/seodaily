import type { Category, Service } from "@/db/schema";

import { MainServiceBlock } from "./main-service-block";

type Props = {
  categories: Category[];
  /** Sub-services of each category, in the same order as `categories`. */
  items: Service[][];
};

export function ServicesMainSection({ categories, items }: Props) {
  return (
    <section id="services-main" className="section bg-white">
      <div className="container-site flex flex-col gap-16 lg:gap-24">
        {categories.map((c, i) => (
          <div
            key={c.slug}
            id={`service-${c.slug}`}
            className={i > 0 ? "border-t border-line pt-16 lg:border-0 lg:pt-0" : undefined}
          >
            <MainServiceBlock index={i} category={c} items={items[i]} mirrored={i % 2 === 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
