import { StatCounter } from "@/components/atoms";
import { cx, vars } from "@/lib/utils";

export type StatItem = { value: number; suffix?: string; label: string };

/** Dark strip of stable summary numbers. */
export function StatsBand({ items, className }: { items: StatItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div className={cx("surface-dark overflow-hidden rounded-xl px-6 py-8 lg:rounded-2xl lg:px-12 lg:py-12", className)}>
      <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "36px" })} />
      <span aria-hidden="true" className="orb orb-blue -top-40 right-1/4 size-[380px]" />
      <span aria-hidden="true" className="orb orb-cyan -bottom-48 left-10 size-[360px]" style={vars({ i: 1 })} />
      <dl className="relative grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]" style={vars({ cols: items.length })}>
        {items.map((item, i) => (
          <div
            key={item.label}
            className="reveal flex flex-col gap-1 lg:border-r lg:border-white/10 lg:pr-8 lg:first:border-r-0 lg:first:pr-0"
            style={vars({ i })}
          >
            <dt className="order-2 text-sm leading-[1.8] text-inverse-muted lg:text-base">{item.label}</dt>
            <dd className="order-1 text-4xl leading-[1.3] font-bold lg:text-5xl">
              <StatCounter value={item.value} suffix={item.suffix} className="text-gradient" />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
