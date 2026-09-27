import { Icon } from "@/components/atoms";

import { cx, stepNo } from "@/lib/utils";

type Item = { question: string; answer: string };

function Plus() {
  return (
    <span
      aria-hidden="true"
      className="faq-plus flex size-9 shrink-0 items-center justify-center rounded-full bg-soft text-brand transition-transform duration-200 lg:size-10"
    >
      <Icon name="plus" size={18} />
    </span>
  );
}

/**
 * Native <details> accordion in the design's variants:
 * - lines: hairline rows (home, web design)
 * - boxed: separate bordered cards (services)
 * - panel: rows inside one white panel (service template)
 * - numbered: rows with a blue index (SEO)
 */
export function FaqList({
  items,
  variant = "lines",
}: {
  items: Item[];
  variant?: "lines" | "boxed" | "panel" | "numbered";
}) {
  if (items.length === 0) return null;

  if (variant === "boxed") {
    return (
      <div className="flex flex-col gap-2 lg:gap-3">
        {items.map((item, i) => (
          <details key={i} open={i === 0} className="rounded-md border border-line bg-white">
            <summary className="flex items-center justify-between gap-3 p-4 lg:gap-6 lg:px-6 lg:py-5">
              <span className="text-base leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">{item.question}</span>
              <Plus />
            </summary>
            <p className="px-4 pb-4 text-base leading-[1.9] text-ink-2 lg:ps-6 lg:pe-[88px] lg:pb-6">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    );
  }

  if (variant === "numbered") {
    return (
      <div className="border-t border-line">
        {items.map((item, i) => (
          <details key={i} open={i === 0} className="border-b border-line">
            <summary className="grid grid-cols-[32px_minmax(0,1fr)_36px] items-center gap-2 py-5 lg:grid-cols-[64px_minmax(0,1fr)_40px] lg:gap-0 lg:py-6">
              <span className="text-sm leading-[1.7] font-semibold text-brand lg:text-base lg:leading-normal">{stepNo(i)}</span>
              <span className="text-base leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">{item.question}</span>
              <Plus />
            </summary>
            <p className="pb-5 text-base leading-[1.9] text-ink-2 lg:ps-16 lg:pe-[104px] lg:pb-6">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cx(
        variant === "panel"
          ? "rounded-md border border-line bg-white px-5 lg:rounded-xl lg:px-10"
          : "border-t border-line",
      )}
    >
      {items.map((item, i) => (
        <details
          key={i}
          open={i === 0}
          className={cx("border-line", variant === "panel" && i === items.length - 1 ? "" : "border-b")}
        >
          <summary className="flex items-center justify-between gap-4 py-5 lg:gap-6 lg:py-6">
            <span className="text-base leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">{item.question}</span>
            <Plus />
          </summary>
          <p className="pb-5 text-base leading-[1.9] text-ink-2 lg:pe-16 lg:pb-6">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
