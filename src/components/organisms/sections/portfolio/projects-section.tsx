import { IconTile } from "@/components/atoms";
import { PortfolioGrid, type PortfolioItem } from "@/components/organisms";

type Props = {
  items: PortfolioItem[];
};

export function PortfolioProjectsSection({ items }: Props) {
  return items.length > 0 ? (
    <PortfolioGrid items={items} />
  ) : (
    <section className="section bg-white">
      <div className="container-site">
        <div className="reveal flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong bg-page px-6 py-12 text-center lg:py-16">
          <IconTile name="folder" tone="gradient" className="size-14 rounded-2xl" iconSize={26} />
          <p className="text-base leading-[1.9] text-muted">نمونه‌کارها به‌زودی در این بخش نمایش داده می‌شوند.</p>
        </div>
      </div>
    </section>
  );
}
