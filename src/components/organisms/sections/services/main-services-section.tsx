import type { Category, Service } from "@/db/schema";

import { MainServiceBlock } from "./main-service-block";

type Props = {
  categories: Category[];
  /** Sub-services of each category, in the same order as `categories`. */
  items: Service[][];
};

export function ServicesMainSection({ categories, items }: Props) {
  return (
    <section id="services-main" className="section">
      <div className="container-site flex flex-col gap-6 lg:gap-8">
        {categories.map((c, i) => (
          <MainServiceBlock key={c.slug} index={i} category={c} items={items[i] ?? []} mirrored={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
