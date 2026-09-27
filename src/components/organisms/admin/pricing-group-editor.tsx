"use client";

import { useId } from "react";

import { Badge } from "@/components/atoms/badge";
import { GROUP_TYPE_LABELS, GROUP_TYPES, OPTIONS_MAX, QTY_LIMIT, type GroupType, type PricingGroup, type PricingOption } from "@/modules/pricing/types";

import { AddButton, CheckboxInput, CountInput, moveItem, newId, PriceInput, RowTools, TextInput } from "./pricing-editor-fields";

const TYPE_HINTS: Record<GroupType, string> = {
  single: "بازدیدکننده یکی از گزینه‌ها را انتخاب می‌کند (مثل نوع سایت).",
  multi: "بازدیدکننده هر تعداد از گزینه‌ها را انتخاب می‌کند (مثل امکانات اضافه).",
  quantity: "بازدیدکننده یک عدد وارد می‌کند و در قیمت واحد ضرب می‌شود (مثل تعداد صفحات).",
};

export function blankOption(): PricingOption {
  return { id: newId("opt"), label: "", price: 0, description: "" };
}

/** Editor of one calculator group: its type, texts and options or quantity settings. */
export function PricingGroupEditor({
  group,
  quantityGroups,
  onChange,
}: {
  group: PricingGroup;
  /** Other quantity groups this one can be priced per unit of. */
  quantityGroups: PricingGroup[];
  onChange: (group: PricingGroup) => void;
}) {
  const typeId = useId();
  const perUnitId = useId();
  const g = group;
  const set = (patch: Partial<PricingGroup>) => onChange({ ...g, ...patch });
  const setOptions = (options: PricingOption[]) => set({ options });

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
        <TextInput label="عنوان گروه" value={g.title} onChange={(title) => set({ title })} placeholder="مثلاً نوع سایت" />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={typeId} className="field-label">
            نوع
          </label>
          <select id={typeId} value={g.type} onChange={(e) => set({ type: e.target.value as GroupType })} className="field cursor-pointer bg-white">
            {GROUP_TYPES.map((t) => (
              <option key={t} value={t}>
                {GROUP_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="-mt-2 text-xs leading-[1.8] text-muted">{TYPE_HINTS[g.type]}</p>
      <TextInput label="راهنما (اختیاری)" value={g.help} onChange={(help) => set({ help })} placeholder="یک جمله کوتاه زیر عنوان گروه" />

      {g.type === "single" && <CheckboxInput label="انتخاب یکی از گزینه‌ها الزامی است" checked={g.required} onChange={(required) => set({ required })} />}

      {g.type !== "quantity" && quantityGroups.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={perUnitId} className="field-label">
            قیمت گزینه‌ها برای هر واحدِ
          </label>
          <select id={perUnitId} value={g.perUnitOf} onChange={(e) => set({ perUnitOf: e.target.value })} className="field cursor-pointer bg-white">
            <option value="">— یک‌بار (در تعداد ضرب نمی‌شود)</option>
            {quantityGroups.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title || "گروه بی‌نام"}
                {q.unitLabel ? ` (هر ${q.unitLabel})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs leading-[1.8] text-muted">مثلاً قیمت «طول مقاله» برای هر مقاله است و در «تعداد مقاله» ضرب می‌شود.</p>
        </div>
      )}

      {g.type === "quantity" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextInput label="واحد" value={g.unitLabel} onChange={(unitLabel) => set({ unitLabel })} placeholder="مثلاً صفحه" />
          <PriceInput label="قیمت هر واحد (تومان)" value={g.unitPrice} onChange={(unitPrice) => set({ unitPrice })} />
          <CountInput label="حداقل" value={g.min} max={QTY_LIMIT} onChange={(min) => set({ min })} />
          <CountInput label="حداکثر" value={g.max} max={QTY_LIMIT} onChange={(max) => set({ max })} />
          <CountInput label="مقدار پیش‌فرض" value={g.defaultQty} max={QTY_LIMIT} onChange={(defaultQty) => set({ defaultQty })} />
          <p className="self-center text-xs leading-[1.8] text-muted sm:col-span-2 lg:col-span-1">
            اگر قیمت واحد صفر باشد و گروه دیگری «برای هر واحد» این تعداد قیمت‌گذاری شود، این گروه فقط تعداد را مشخص می‌کند.
          </p>
        </div>
      ) : (
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="field-label p-0">
            گزینه‌ها <Badge>{g.options.length}</Badge>
          </legend>
          <ol className="mt-3 flex flex-col gap-3">
            {g.options.map((o, i) => (
              <li key={o.id} className="flex items-start gap-3 rounded-md border border-line bg-white p-3">
                <span className="mt-9 w-5 shrink-0 text-center text-sm font-bold text-brand">{i + 1}</span>
                <div className="grid min-w-0 grow gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
                  <TextInput label="عنوان گزینه" value={o.label} onChange={(label) => setOptions(g.options.map((x, j) => (j === i ? { ...x, label } : x)))} />
                  <PriceInput label="قیمت (تومان)" value={o.price} onChange={(price) => setOptions(g.options.map((x, j) => (j === i ? { ...x, price } : x)))} />
                  <div className="md:col-span-2">
                    <TextInput
                      label="توضیح کوتاه (اختیاری)"
                      value={o.description}
                      onChange={(description) => setOptions(g.options.map((x, j) => (j === i ? { ...x, description } : x)))}
                    />
                  </div>
                </div>
                <RowTools
                  index={i}
                  count={g.options.length}
                  name={`گزینه ${i + 1}`}
                  onMove={(d) => setOptions(moveItem(g.options, i, d))}
                  onRemove={() => setOptions(g.options.filter((_, j) => j !== i))}
                />
              </li>
            ))}
          </ol>
          {g.options.length < OPTIONS_MAX && (
            <div className="mt-3">
              <AddButton label="افزودن گزینه" onClick={() => setOptions([...g.options, blankOption()])} />
            </div>
          )}
        </fieldset>
      )}
    </div>
  );
}
