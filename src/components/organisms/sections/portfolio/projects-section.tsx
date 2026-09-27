import { PortfolioGrid, type PortfolioItem } from "@/components/organisms";

type Props = {
  items: PortfolioItem[];
};

export function PortfolioProjectsSection({ items }: Props) {
  return items.length > 0 ? (
    <PortfolioGrid items={items} />
  ) : (
    <section className="border-t border-line bg-white py-16">
      <div className="container-site">
        <p className="text-base leading-[1.9] text-muted">نمونه‌کارها به‌زودی در این بخش نمایش داده می‌شوند.</p>
      </div>
    </section>
  );
}
