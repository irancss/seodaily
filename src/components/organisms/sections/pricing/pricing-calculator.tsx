"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { toast } from "@/lib/toast";
import { cx } from "@/lib/utils";
import { computeEstimate, initialChoices, isCountOnly } from "@/modules/pricing/estimate";
import { formatTotal } from "@/modules/pricing/format";
import type { EstimateSelection, PricingService, ServicePricing } from "@/modules/pricing/types";

import { EstimateForm, EstimateSummary } from "./estimate-panel";
import { OptionGroup } from "./option-group";
import { PlanCards } from "./plan-cards";

type Choices = EstimateSelection["choices"];

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/**
 * Pricing table, calculator and request form of one service. A plan is a
 * ready package: picking one makes it the whole estimate and pauses the
 * calculator until it is cleared. The total shown here is only a preview;
 * the submit action recomputes it from the saved prices.
 */
export function PricingCalculator({ service, label, pricing }: { service: PricingService; label: string; pricing: ServicePricing }) {
  const [planId, setPlanId] = useState<string | null>(null);
  const [choices, setChoices] = useState<Choices>(() => initialChoices(pricing));
  const [showErrors, setShowErrors] = useState(false);
  // Bumped for a new estimate after a successful request, to reset the form.
  const [round, setRound] = useState(0);

  const estimate = useMemo(() => computeEstimate(pricing, { planId, choices }), [pricing, planId, choices]);
  const plan = pricing.plans.find((p) => p.id === planId);
  const hasGroups = pricing.groups.length > 0;
  const summaryId = `estimate-${service}`;
  const groupDomId = (groupId: string) => `${service}-group-${groupId}`;

  if (!hasGroups && pricing.plans.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line-strong bg-white p-8 lg:items-center lg:p-12 lg:text-center">
        <p className="t-h3">تعرفه {label} به‌زودی اعلام می‌شود</p>
        <p className="body-lg max-w-[560px]">برای دریافت قیمت، درخواست مشاوره بدهید تا جزئیات را بررسی کنیم و با شما تماس بگیریم.</p>
        <Link href={`/contact?service=${service}`} className="btn btn-primary h-12 px-6">
          درخواست مشاوره
        </Link>
      </div>
    );
  }

  function setChoice(groupId: string, value: Choices[string] | undefined) {
    setChoices((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[groupId];
      else next[groupId] = value;
      return next;
    });
  }

  function choosePlan(id: string | null) {
    setPlanId(id);
    if (id) document.getElementById(summaryId)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }

  function validate() {
    const { errors } = estimate;
    if (Object.keys(errors).length === 0) return true;
    setShowErrors(true);
    // The first problem in page order; `plan` and `empty` belong to no group.
    const group = pricing.groups.find((g) => errors[g.id]);
    toast.error(group ? errors[group.id] : Object.values(errors)[0]);
    const target = group && document.getElementById(groupDomId(group.id));
    if (target) {
      target.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
      target.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true });
    }
    return false;
  }

  function reset() {
    setPlanId(null);
    setChoices(initialChoices(pricing));
    setShowErrors(false);
    setRound((r) => r + 1);
  }

  const unitOf = (groupId: string) => pricing.groups.find((g) => g.id === groupId)?.unitLabel || "واحد";
  const dependentsOf = (groupId: string) => pricing.groups.filter((g) => g.type !== "quantity" && g.perUnitOf === groupId).map((g) => g.title);

  return (
    <div className="mt-10 lg:mt-14">
      {pricing.plans.length > 0 && <PlanCards plans={pricing.plans} selectedId={planId} onChoose={choosePlan} withCalculator={hasGroups} />}

      <div
        className={cx(
          "grid items-start gap-8",
          hasGroups ? "lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10" : "mx-auto max-w-[480px]",
          pricing.plans.length > 0 && "mt-12 lg:mt-16",
        )}
      >
        {hasGroups && (
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <div className="flex flex-col gap-1">
              <h3 className="t-h3">{pricing.plans.length > 0 ? "یا برآورد اختصاصی بسازید" : `ماشین‌حساب هزینه ${label}`}</h3>
              <p className="text-base leading-[1.9] text-ink-2">گزینه‌های موردنیازتان را انتخاب کنید؛ جمع هزینه همان لحظه محاسبه می‌شود.</p>
            </div>

            {plan && (
              <div role="status" className="flex flex-col items-start gap-3 rounded-xl border border-brand/30 bg-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-[1.8] text-ink">
                  پلن «{plan.name}» به‌عنوان برآورد شما انتخاب شده است. برای برآورد اختصاصی، انتخاب پلن را لغو کنید.
                </p>
                <button type="button" onClick={() => setPlanId(null)} className="btn btn-secondary h-10 shrink-0 px-4 text-sm">
                  لغو انتخاب پلن
                </button>
              </div>
            )}

            <fieldset disabled={Boolean(plan)} className={cx("m-0 flex min-w-0 flex-col gap-4 border-0 p-0 transition-opacity lg:gap-5", plan && "opacity-50")}>
              <legend className="sr-only">گزینه‌های {label}</legend>
              {pricing.groups.map((g) => (
                <div key={g.id} id={groupDomId(g.id)}>
                  <OptionGroup
                    group={g}
                    scope={service}
                    value={choices[g.id]}
                    onChange={(value) => setChoice(g.id, value)}
                    error={showErrors ? estimate.errors[g.id] : undefined}
                    perUnit={g.type !== "quantity" && g.perUnitOf ? unitOf(g.perUnitOf) : undefined}
                    dependents={isCountOnly(g, pricing.groups) ? dependentsOf(g.id) : undefined}
                  />
                </div>
              ))}
            </fieldset>

            {/* Mobile: the running total stays at the bottom while the options scroll by
                (inset on the right, where the floating call button sits). */}
            <div className="sticky bottom-4 z-20 ms-16 lg:hidden">
              <a
                href={`#${summaryId}`}
                className="surface-dark flex h-14 items-center justify-between gap-3 rounded-full ps-5 pe-2 text-white no-underline shadow-lg hover:text-white"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-[11px] leading-[1.6] text-inverse-muted">جمع برآورد</span>
                  <span className="truncate text-[15px] leading-[1.5] font-bold">{formatTotal(estimate.total)}</span>
                </span>
                <span className="btn btn-white h-10 shrink-0 rounded-full px-4 text-sm">ثبت درخواست</span>
              </a>
            </div>
          </div>
        )}

        {/* Sticky on desktop; on short screens it scrolls inside so the form stays reachable. */}
        <aside
          id={summaryId}
          aria-label={`خلاصه برآورد ${label}`}
          className="rounded-2xl lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-contain"
        >
          <div className="surface-dark overflow-hidden rounded-2xl p-6 shadow-lg lg:p-7">
            <span aria-hidden="true" className="orb orb-blue -top-32 -left-28 size-72 opacity-60" />
            <EstimateSummary estimate={estimate} label={label} note={pricing.note} />
            <EstimateForm
              key={round}
              service={service}
              selection={JSON.stringify({ planId, choices })}
              validate={validate}
              estimateError={showErrors ? (estimate.errors.empty ?? estimate.errors.plan) : undefined}
              onReset={reset}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
