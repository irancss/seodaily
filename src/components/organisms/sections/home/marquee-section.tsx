import { Icon } from "@/components/atoms";
import { Marquee } from "@/components/molecules";
import { vars } from "@/lib/utils";

/**
 * Gradient ribbon with the sub-service names scrolling by. Decorative: the
 * services section lists them as links, so the names are drawn by CSS (see
 * `.css-label`) instead of adding two more copies to the page text.
 */
export function HomeMarqueeSection({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div aria-hidden="true" className="ribbon py-4 lg:py-5" style={vars({ "marquee-gap": "40px" })}>
      <Marquee
        duration={Math.max(30, items.length * 5)}
        items={items.map((item) => (
          <span key={item} className="flex items-center gap-10 text-base leading-[1.8] font-semibold whitespace-nowrap lg:text-lg">
            <span className="css-label" data-label={item} />
            <Icon name="sparkle" size={18} className="text-cyan-200" />
          </span>
        ))}
      />
    </div>
  );
}
