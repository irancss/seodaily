"use client";

import { useRef, useState } from "react";

import { Badge } from "@/components/atoms/badge";
import { ConfirmButton } from "@/components/atoms/confirm-button";
import { Icon } from "@/components/atoms/icon";
import { SubmitButton } from "@/components/atoms/submit-button";
import { Card } from "@/components/molecules/card";
import { resetContractTemplate, saveContractTemplate } from "@/modules/contracts/actions";
import { CONTRACT_PLACEHOLDERS, TEMPLATE_MAX } from "@/modules/contracts/types";
import { PRICING_SERVICE_LABELS, type PricingService } from "@/modules/pricing/types";

const BLOCKS = new Set(["items_table", "signatures"]);

/** Template textarea with the placeholder list beside it (a click inserts at the cursor). */
export function ContractTemplateEditor({ service, template, customized }: { service: PricingService; template: string; customized: boolean }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(template);
  // After a save the page sends the stored text; start over from it.
  const [source, setSource] = useState(template);
  if (template !== source) {
    setSource(template);
    setValue(template);
  }
  const label = PRICING_SERVICE_LABELS[service];

  function insert(key: string) {
    const el = textarea.current;
    if (!el) return;
    // Tables and signatures are blocks, so they get a line of their own.
    const token = BLOCKS.has(key) ? `\n{{${key}}}\n` : `{{${key}}}`;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setValue(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-4">
        <p className="flex items-start gap-2 rounded-md border border-warning-bg bg-warning-bg px-4 py-3 text-sm leading-[1.9] text-warning">
          <Icon name="alert" size={18} className="mt-1 shrink-0" />
          <span>
            <strong>متن پیش‌فرض فقط یک نمونه است</strong> و جایگزین مشاوره حقوقی نیست. پیش از استفاده، آن را با شرایط کاری خودتان تطبیق دهید و
            ترجیحاً با یک مشاور حقوقی بازبینی کنید.
          </span>
        </p>
        <Card>
          <form action={saveContractTemplate} className="grid gap-4">
            <input type="hidden" name="service" value={service} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="contract-template" className="text-lg leading-[1.7] font-bold">
                متن قرارداد {label}
              </label>
              <Badge tone={customized ? "green" : "amber"}>{customized ? "ویرایش‌شده" : "متن نمونه"}</Badge>
            </div>
            <textarea
              ref={textarea}
              id="contract-template"
              name="template"
              rows={28}
              maxLength={TEMPLATE_MAX}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="field text-[15px] leading-8"
            />
            <p className="text-xs leading-[1.8] text-muted">
              خروجی را از صفحه هر درخواست با دکمه «ساخت قرارداد» ببینید. اگر متن را خالی ذخیره کنید، متن نمونه برمی‌گردد.
            </p>
            <div>
              <SubmitButton>ذخیره قالب</SubmitButton>
            </div>
          </form>
          {customized && (
            <form action={resetContractTemplate} className="mt-4 border-t border-line pt-4">
              <input type="hidden" name="service" value={service} />
              <ConfirmButton message="متن ویرایش‌شده پاک شود و متن نمونه برگردد؟">بازگشت به متن نمونه</ConfirmButton>
            </form>
          )}
        </Card>
      </div>

      <aside className="lg:sticky lg:top-6">
        <Card title="جای‌گذاری‌ها" description="روی هر مورد بزنید تا در محل نشانگر متن قرار بگیرد.">
          <ul className="-mx-2 flex flex-col">
            {CONTRACT_PLACEHOLDERS.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => insert(p.key)}
                  className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-start hover:bg-soft"
                >
                  <code dir="ltr" className="text-xs font-semibold text-brand-hover">{`{{${p.key}}}`}</code>
                  <span className="text-xs leading-[1.7] text-ink-2">{p.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-sm font-bold">قالب‌بندی</h3>
          <ul className="mt-2 flex flex-col gap-1 text-xs leading-[1.9] text-ink-2">
            <li>
              <code dir="ltr">#</code> در ابتدای خط: عنوان قرارداد
            </li>
            <li>
              <code dir="ltr">##</code> در ابتدای خط: عنوان ماده
            </li>
            <li>
              <code dir="ltr">-</code> در ابتدای خط: بند فهرست
            </li>
            <li>یک خط خالی: پاراگراف تازه</li>
            <li>«……»: جای خالی برای تکمیل دستی</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}
