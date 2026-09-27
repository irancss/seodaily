import { Icon } from "@/components/atoms";

import { cx, stepNo, vars } from "@/lib/utils";

type Item = { question: string; answer: string };

/**
 * Native <details> accordion: separate cards that open smoothly (see
 * `.faq-item` and `details::details-content` in globals.css). `numbered`
 * adds a blue index before each question.
 */
export function FaqList({
  items,
  variant = "cards",
  className,
}: {
  items: Item[];
  variant?: "cards" | "numbered";
  className?: string;
}) {
  if (items.length === 0) return null;
  const numbered = variant === "numbered";

  return (
    <div className={cx("flex flex-col gap-3", className)}>
      {items.map((item, i) => (
        <details key={i} open={i === 0} className="faq-item reveal" style={vars({ i: Math.min(i, 5) })}>
          <summary className="flex items-center gap-3 px-4 py-4 lg:gap-4 lg:px-6 lg:py-5">
            {numbered && (
              <span className="w-7 shrink-0 text-sm leading-[1.7] font-bold text-brand lg:w-9 lg:text-base">{stepNo(i)}</span>
            )}
            <span className="grow text-base leading-[1.9] font-semibold lg:text-lg lg:leading-[1.8]">{item.question}</span>
            <span aria-hidden="true" className="faq-plus size-9 lg:size-10">
              <Icon name="plus" size={18} />
            </span>
          </summary>
          <p
            className={cx(
              "px-4 pb-5 text-base leading-[1.9] whitespace-pre-line text-ink-2 lg:px-6 lg:pb-6",
              numbered ? "lg:ps-[76px] lg:pe-[88px]" : "lg:pe-[88px]",
            )}
          >
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
