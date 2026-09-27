"use client";

import { useEffect, useId, useState } from "react";

import { ConfirmButton } from "@/components/atoms/confirm-button";
import { EmptyState } from "@/components/atoms/empty-state";
import { Icon } from "@/components/atoms/icon";
import { SubmitButton } from "@/components/atoms/submit-button";
import { Card } from "@/components/molecules/card";
import { resetPricingService, savePricing } from "@/modules/pricing/actions";
import {
  GROUP_TYPE_LABELS,
  GROUPS_MAX,
  PLANS_MAX,
  PRICING_SERVICE_LABELS,
  type PricingGroup,
  type PricingPlan,
  type PricingService,
  type ServicePricing,
} from "@/modules/pricing/types";

import { AddButton, CheckboxInput, moveItem, newId, PriceInput, RowTools, TextInput } from "./pricing-editor-fields";
import { blankOption, PricingGroupEditor } from "./pricing-group-editor";

const PERIODS = ["یک‌بار", "ماهانه", "سه‌ماهه", "سالانه"];

function blankPlan(): PricingPlan {
  return { id: newId("plan"), name: "", price: 0, period: "", description: "", features: [], highlighted: false };
}

function blankGroup(): PricingGroup {
  return {
    id: newId("group"),
    type: "single",
    title: "",
    help: "",
    required: false,
    options: [blankOption()],
    perUnitOf: "",
    unitLabel: "",
    unitPrice: 0,
    min: 1,
    max: 10,
    defaultQty: 1,
  };
}

function hasAnyPrice(data: ServicePricing) {
  return data.plans.some((p) => p.price > 0) || data.groups.some((g) => g.unitPrice > 0 || g.options.some((o) => o.price > 0));
}

/**
 * Plans and calculator groups of one service. The whole state is posted as
 * JSON; the server validates it (entries without a name are dropped).
 */
export function PricingEditor({ service, initial }: { service: PricingService; initial: ServicePricing }) {
  const periodsId = useId();
  const [data, setData] = useState(initial);
  // After a save the page sends the normalised config; start over from it.
  const [source, setSource] = useState(initial);
  if (initial !== source) {
    setSource(initial);
    setData(initial);
  }

  const json = JSON.stringify(data);
  const dirty = json !== JSON.stringify(source);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setPlans = (fn: (plans: PricingPlan[]) => PricingPlan[]) => setData((d) => ({ ...d, plans: fn(d.plans) }));
  const setGroups = (fn: (groups: PricingGroup[]) => PricingGroup[]) => setData((d) => ({ ...d, groups: fn(d.groups) }));
  const setPlan = (i: number, patch: Partial<PricingPlan>) => setPlans((plans) => plans.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const label = PRICING_SERVICE_LABELS[service];

  return (
    <>
      <form action={savePricing} className="flex flex-col gap-6">
        <input type="hidden" name="service" value={service} />
        <input type="hidden" name="config" value={json} />

        {!hasAnyPrice(data) && (
          <p className="flex items-start gap-2 rounded-md border border-warning-bg bg-warning-bg px-4 py-3 text-sm leading-[1.8] text-warning">
            <Icon name="info" size={18} className="mt-0.5 shrink-0" />
            هنوز هیچ قیمتی برای {label} وارد نشده است؛ تا وقتی قیمت‌ها صفر باشند، همه گزینه‌ها در سایت «توافقی» نمایش داده می‌شوند.
          </p>
        )}

        <Card title="متن‌ها">
          <div className="grid gap-5">
            <TextInput
              label="معرفی (زیر عنوان تب)"
              value={data.intro}
              onChange={(intro) => setData((d) => ({ ...d, intro }))}
              multiline
              rows={3}
            />
            <TextInput
              label="یادداشت زیر جمع برآورد (اختیاری)"
              value={data.note}
              onChange={(note) => setData((d) => ({ ...d, note }))}
              placeholder="مثلاً: مالیات بر ارزش افزوده جداگانه محاسبه می‌شود."
            />
          </div>
        </Card>

        <Card
          title="پلن‌ها (جدول تعرفه)"
          description="بسته‌های آماده. اگر پلنی تعریف نشود، جدول در سایت نمایش داده نمی‌شود. بازدیدکننده می‌تواند یک پلن را به‌جای ماشین‌حساب انتخاب کند."
        >
          <datalist id={periodsId}>
            {PERIODS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          {data.plans.length === 0 ? (
            <EmptyState>هنوز پلنی تعریف نشده است.</EmptyState>
          ) : (
            <ol className="flex flex-col gap-4">
              {data.plans.map((plan, i) => (
                <li key={plan.id} className="flex items-start gap-3 rounded-md border border-line bg-page p-4">
                  <span className="mt-9 w-5 shrink-0 text-center text-sm font-bold text-brand">{i + 1}</span>
                  <div className="grid min-w-0 grow gap-4 sm:grid-cols-2">
                    <TextInput label="نام پلن" value={plan.name} onChange={(name) => setPlan(i, { name })} placeholder="مثلاً پایه" />
                    <PriceInput label="قیمت (تومان)" value={plan.price} onChange={(price) => setPlan(i, { price })} />
                    <TextInput label="دوره پرداخت" value={plan.period} onChange={(period) => setPlan(i, { period })} placeholder="مثلاً یک‌بار یا ماهانه" list={periodsId} />
                    <div className="flex items-end">
                      <CheckboxInput label="پلن ویژه (پررنگ‌تر نمایش داده شود)" checked={plan.highlighted} onChange={(highlighted) => setPlan(i, { highlighted })} />
                    </div>
                    <div className="sm:col-span-2">
                      <TextInput label="توضیح کوتاه" value={plan.description} onChange={(description) => setPlan(i, { description })} />
                    </div>
                    <div className="sm:col-span-2">
                      <TextInput
                        label="ویژگی‌ها (هر خط یک مورد)"
                        value={plan.features.join("\n")}
                        onChange={(text) => setPlan(i, { features: text.split("\n") })}
                        multiline
                        rows={4}
                      />
                    </div>
                  </div>
                  <RowTools
                    index={i}
                    count={data.plans.length}
                    name={`پلن ${i + 1}`}
                    onMove={(d) => setPlans((plans) => moveItem(plans, i, d))}
                    onRemove={() => setPlans((plans) => plans.filter((_, j) => j !== i))}
                    confirm="این پلن حذف شود؟"
                  />
                </li>
              ))}
            </ol>
          )}
          {data.plans.length < PLANS_MAX && (
            <div className="mt-4">
              <AddButton label="افزودن پلن" onClick={() => setPlans((plans) => [...plans, blankPlan()])} />
            </div>
          )}
        </Card>

        <Card
          title="ماشین‌حساب (گروه گزینه‌ها)"
          description="هر گروه یک سؤال ماشین‌حساب است. قیمت‌ها به تومان است؛ قیمت صفر «توافقی» نمایش داده می‌شود و در جمع حساب نمی‌شود. گروه یا گزینه بدون عنوان ذخیره نمی‌شود."
        >
          {data.groups.length === 0 ? (
            <EmptyState>هنوز گروهی تعریف نشده است؛ بدون گروه، ماشین‌حساب نمایش داده نمی‌شود.</EmptyState>
          ) : (
            <ol className="flex flex-col gap-4">
              {data.groups.map((group, i) => (
                <li key={group.id} className="rounded-md border border-line bg-page p-4">
                  <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
                    <span className="text-sm font-bold text-brand">{i + 1}</span>
                    <span className="truncate text-sm font-semibold">{group.title || "گروه بی‌نام"}</span>
                    <span className="text-xs text-muted">({GROUP_TYPE_LABELS[group.type]})</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 grow">
                      <PricingGroupEditor
                        group={group}
                        quantityGroups={data.groups.filter((q) => q.type === "quantity" && q.id !== group.id)}
                        onChange={(next) => setGroups((groups) => groups.map((x, j) => (j === i ? next : x)))}
                      />
                    </div>
                    <RowTools
                      index={i}
                      count={data.groups.length}
                      name={`گروه ${i + 1}`}
                      onMove={(d) => setGroups((groups) => moveItem(groups, i, d))}
                      onRemove={() => setGroups((groups) => groups.filter((_, j) => j !== i))}
                      confirm="این گروه و همه گزینه‌هایش حذف شود؟"
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
          {data.groups.length < GROUPS_MAX && (
            <div className="mt-4">
              <AddButton label="افزودن گروه" onClick={() => setGroups((groups) => [...groups, blankGroup()])} />
            </div>
          )}
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-md sm:border">
          <SubmitButton>ذخیره تعرفه {label}</SubmitButton>
          {dirty && <span className="text-sm text-warning">تغییرات ذخیره نشده است.</span>}
        </div>
      </form>

      <form action={resetPricingService} className="mt-6">
        <input type="hidden" name="service" value={service} />
        <ConfirmButton message={`همه پلن‌ها و قیمت‌های ${label} پاک شود و ساختار پیش‌فرض برگردد؟`}>بازگشت به ساختار پیش‌فرض</ConfirmButton>
      </form>
    </>
  );
}
