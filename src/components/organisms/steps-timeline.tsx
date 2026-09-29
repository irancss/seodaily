import { cx, stepNo, vars } from "@/lib/utils";

type Step = { title: string; description?: string };

/**
 * Numbered process steps. Up to four sit in one row on desktop (a column on
 * mobile), joined by stable line segments;
 * longer processes become a grid of numbered cards.
 */
export function StepsTimeline({ steps, className }: { steps: Step[]; className?: string }) {
  if (steps.length === 0) return null;

  if (steps.length > 4) {
    return (
      <ol className={cx("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6", className)}>
        {steps.map((step, i) => (
          <li key={i} className="reveal card-fancy flex flex-col items-start rounded-xl p-6 lg:p-7" style={vars({ i: i % 3 })}>
            <span className="step-dot">{stepNo(i)}</span>
            <h3 className="t-h3 mt-5">{step.title}</h3>
            {step.description && <p className="mt-2 text-base leading-[1.9] text-ink-2">{step.description}</p>}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol
      className={cx("grid gap-8 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]", className)}
      style={vars({ cols: steps.length })}
    >
      {steps.map((step, i) => (
        <li key={i} className="relative grid grid-cols-[48px_minmax(0,1fr)] gap-4 lg:flex lg:flex-col lg:gap-0">
          {i < steps.length - 1 && (
            <>
              {/* Segment to the next step: down on mobile, sideways (to the left) on desktop. */}
              <span aria-hidden="true" className="absolute top-14 right-[23px] h-[calc(100%-32px)] w-0.5 rounded-full bg-line lg:hidden">
                <span className="step-line step-line-v grow-y" />
              </span>
              <span aria-hidden="true" className="absolute top-[27px] right-16 hidden h-0.5 w-[calc(100%-40px)] rounded-full bg-line lg:block">
                <span className="step-line grow-x origin-right" />
              </span>
            </>
          )}
          <span className="step-dot reveal-scale" style={vars({ i })}>
            {stepNo(i)}
          </span>
          <div className="reveal pt-1 lg:pt-0" style={vars({ i })}>
            <h3 className="t-h3 lg:mt-6">{step.title}</h3>
            {step.description && <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{step.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
