import { Icon } from "@/components/atoms";
import { Marquee } from "@/components/molecules";
import { vars } from "@/lib/utils";

/**
 * Tilted gradient ribbon crossing the bottom edge of the hero, with the design
 * principles and platforms scrolling by. Decorative: the sections below list
 * the same words as real content, so the words are drawn by CSS (see
 * `.css-label`) and don't repeat four times in the page text.
 */
export function WebDesignRibbon({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  // Short lists are repeated so the track is always wider than the screen.
  const words = items.length < 10 ? [...items, ...items] : items;
  return (
    <div aria-hidden="true" className="relative z-10 -mt-7 overflow-hidden py-3 lg:-mt-10 lg:py-6">
      <div className="ribbon -mx-6 -rotate-[1.5deg] py-3.5 shadow-lg lg:py-4" style={vars({ "marquee-gap": "36px" })}>
        <Marquee
          duration={Math.max(36, words.length * 4)}
          items={words.map((word, i) => (
            <span key={i} className="flex items-center gap-9 text-base leading-[1.8] font-semibold whitespace-nowrap lg:text-lg">
              <span className="css-label" data-label={word} />
              <Icon name="sparkle" size={18} className="text-cyan-200" />
            </span>
          ))}
        />
      </div>
    </div>
  );
}
