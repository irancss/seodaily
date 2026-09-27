"use client";

import { useState } from "react";

import { SubmitButton } from "@/components/atoms/submit-button";
import type { EstimateItem } from "@/db/schema";
import { itemTitle, sumItems } from "@/modules/leads/estimate";
import { saveLeadEstimate } from "@/modules/leads/actions";
import { formatNumber, formatPrice, formatTotal } from "@/modules/pricing/format";
import { PRICE_MAX, QTY_LIMIT } from "@/modules/pricing/types";

import { AddButton, moveItem, newId, PriceInput, RowTools, TextInput } from "./pricing-editor-fields";

type Row = EstimateItem & { key: string };

function toRow(item: EstimateItem): Row {
  return { ...item, key: newId("row") };
}

/**
 * Lines of a lead's estimate as «title + amount». Calculator lines keep their
 * quantity and unit price until their amount is edited.
 */
export function EstimateItemsEditor({ leadId, items }: { leadId: number; items: EstimateItem[] }) {
  const [rows, setRows] = useState(() => items.map(toRow));
  // After a save the page sends the stored lines; start over from them.
  const [source, setSource] = useState(items);
  if (items !== source) {
    setSource(items);
    setRows(items.map(toRow));
  }

  const update = (i: number, patch: Partial<Row>) => setRows((list) => list.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const filled = rows.filter((row) => row.label.trim() !== "");
  const payload = JSON.stringify(rows.map(({ group, label, qty, unitPrice, amount }) => ({ group, label, qty, unitPrice, amount })));

  return (
    <form action={saveLeadEstimate} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={leadId} />
      <input type="hidden" name="items" value={payload} />
      {rows.length > 0 && (
        <ol className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <li key={row.key} className="flex items-start gap-3 rounded-md border border-line bg-page p-3">
              <span className="mt-9 w-5 shrink-0 text-center text-sm font-bold text-brand">{formatNumber(i + 1)}</span>
              <div className="grid min-w-0 grow gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                <TextInput label="شرح" value={itemTitle(row)} onChange={(label) => update(i, { group: "", label })} placeholder="مثلاً طراحی صفحه اصلی" />
                <div>
                  <PriceInput
                    label="مبلغ (تومان)"
                    value={row.amount}
                    max={PRICE_MAX * QTY_LIMIT}
                    onChange={(amount) => update(i, { amount, qty: 1, unitPrice: amount })}
                  />
                  {row.qty > 1 && (
                    <p className="text-xs leading-[1.8] text-muted">
                      {formatNumber(row.qty)} × {formatPrice(row.unitPrice)}
                    </p>
                  )}
                </div>
              </div>
              <RowTools
                index={i}
                count={rows.length}
                name={`ردیف ${i + 1}`}
                onMove={(d) => setRows((list) => moveItem(list, i, d))}
                onRemove={() => setRows((list) => list.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ol>
      )}
      <AddButton
        label="افزودن ردیف"
        onClick={() => setRows((list) => [...list, { key: newId("row"), group: "", label: "", qty: 1, unitPrice: 0, amount: 0 }])}
      />
      <p className="text-xs leading-[1.8] text-muted">مبلغ صفر در قرارداد «توافقی» چاپ می‌شود. ردیف بدون شرح ذخیره نمی‌شود و اگر همه ردیف‌ها حذف شوند، برآورد حذف می‌شود.</p>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm">
          جمع کل: <strong>{formatTotal(sumItems(filled))}</strong>
        </p>
        <SubmitButton>ذخیره برآورد</SubmitButton>
      </div>
    </form>
  );
}
