import { Icon } from "@/components/atoms/icon";
import { cx, vars } from "@/lib/utils";
import { formatNumber } from "@/modules/pricing/format";
import type { PricingPlan } from "@/modules/pricing/types";

type Props = {
  plans: PricingPlan[];
  selectedId: string | null;
  onChoose: (id: string | null) => void;
  /** Whether a calculator follows (changes the intro line). */
  withCalculator: boolean;
};

function columns(count: number) {
  if (count === 1) return "max-w-[440px]";
  if (count === 2) return "md:grid-cols-2 lg:max-w-[900px]";
  if (count === 4) return "md:grid-cols-2 xl:grid-cols-4";
  return "md:grid-cols-2 lg:grid-cols-3";
}

/** The pricing table: one card per plan; the highlighted plan is the dark one. */
export function PlanCards({ plans, selectedId, onChoose, withCalculator }: Props) {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h3 className="t-h3">پلن‌های آماده</h3>
        <p className="text-base leading-[1.9] text-ink-2">
          {withCalculator
            ? "یکی از بسته‌ها را انتخاب کنید، یا در ادامه برآورد اختصاصی خودتان را بسازید."
            : "بسته مناسب را انتخاب کنید و درخواستتان را ثبت کنید."}
        </p>
      </div>
      <ul className={cx("mt-6 grid gap-5 lg:mt-8 lg:gap-6", columns(plans.length))}>
        {plans.map((plan, i) => (
          <li key={plan.id} className="reveal" style={vars({ i })}>
            <PlanCard plan={plan} selected={plan.id === selectedId} onChoose={onChoose} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanCard({ plan, selected, onChoose }: { plan: PricingPlan; selected: boolean; onChoose: Props["onChoose"] }) {
  const dark = plan.highlighted;
  const muted = dark ? "text-inverse-muted" : "text-ink-2";
  return (
    <article
      className={cx(
        "relative flex h-full flex-col rounded-2xl p-6 lg:p-8",
        dark ? "surface-dark overflow-hidden shadow-lg" : "card-fancy",
        selected && "outline-3 outline-offset-4 outline-brand",
      )}
    >
      {dark && <span aria-hidden="true" className="orb orb-blue -top-28 -left-24 size-72 opacity-70" />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xl leading-[1.6] font-bold">{plan.name}</h4>
        {selected ? (
          <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 text-xs leading-[1.9] font-semibold", dark ? "bg-white text-brand-active" : "bg-brand text-white")}>
            <Icon name="check" size={14} />
            انتخاب‌شده
          </span>
        ) : (
          dark && <span className="badge-glass px-3 py-0.5 text-xs">پیشنهاد ما</span>
        )}
      </div>
      {plan.description && <p className={cx("mt-2 text-sm leading-[1.8]", muted)}>{plan.description}</p>}

      <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {plan.price > 0 ? (
          <>
            <span className={cx("text-[32px] leading-none font-bold", dark && "text-gradient")}>{formatNumber(plan.price)}</span>
            <span className="text-sm font-medium">تومان</span>
          </>
        ) : (
          <span className="text-2xl leading-none font-bold">توافقی</span>
        )}
        {plan.period && <span className={cx("text-sm", muted)}>/ {plan.period}</span>}
      </p>

      {plan.features.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3 text-sm leading-[1.8]">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <Icon name="check-round" size={18} className={cx("mt-0.5 shrink-0", dark ? "text-cyan-300" : "text-brand")} />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-7">
        <button
          type="button"
          onClick={() => onChoose(selected ? null : plan.id)}
          className={cx("btn h-12 w-full", dark ? (selected ? "btn-glass" : "btn-white") : selected ? "btn-secondary" : "btn-primary")}
        >
          {selected ? "لغو انتخاب" : "انتخاب این پلن"}
        </button>
      </div>
    </article>
  );
}
