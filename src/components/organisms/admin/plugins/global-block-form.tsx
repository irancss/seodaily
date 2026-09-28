"use client";

import { useActionState, useEffect, useState } from "react";

import { SubmitButton } from "@/components/atoms";
import { Card, Field } from "@/components/molecules";
import type { BlockDocument } from "@/modules/blocks/schema";
import { saveGlobalBlockAction, type FormState } from "@/modules/plugins/actions";
import { BLOCK_POSITIONS, BLOCK_POSITION_LABEL } from "@/modules/plugins/labels";
import { toast } from "@/lib/toast";

import { BlockEditor } from "../block-editor/block-editor";
import { submitWithoutReset } from "../block-editor/no-reset-submit";

export type GlobalBlockFormData = {
  id: number | null;
  name: string;
  title: string;
  content: BlockDocument | null;
  position: string;
  sortOrder: number;
  enabled: boolean;
  appliesToAll: boolean;
  includeIds: number[];
  excludeIds: number[];
};

function PluginChecklist({ name, label, options, selected }: { name: string; label: string; options: { id: number; name: string }[]; selected: number[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="field-label mb-2">{label}</legend>
      <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-line p-3 sm:grid-cols-2">
        {options.length === 0 && <span className="text-sm text-muted">افزونه‌ای وجود ندارد.</span>}
        {options.map((o) => (
          <label key={o.id} className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name={name} value={o.id} defaultChecked={selected.includes(o.id)} className="size-[18px] accent-brand" />
            {o.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function GlobalBlockForm({ block, options }: { block: GlobalBlockFormData; options: { id: number; name: string }[] }) {
  const [state, action] = useActionState(saveGlobalBlockAction, { status: "idle" } as FormState);
  const [scope, setScope] = useState(block.appliesToAll ? "all" : "selected");
  useEffect(() => {
    if (state.status === "ok") {
      toast.success(state.message ?? "ذخیره شد.");
      for (const p of state.problems ?? []) toast.info(p);
    } else if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={action} onSubmit={submitWithoutReset(action)} method="post" className="grid gap-6">
      {block.id && <input type="hidden" name="id" value={block.id} />}
      <Card title="بلوک سراسری">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="نام داخلی (فقط در پنل)" name="name" defaultValue={block.name} required maxLength={100} />
          <Field label="عنوان نمایشی (اختیاری)" name="title" defaultValue={block.title} maxLength={150} hint="اگر خالی باشد، بلوک بدون تیتر نمایش داده می‌شود." />
          <label className="flex flex-col gap-2">
            <span className="field-label">جایگاه</span>
            <select name="position" defaultValue={block.position} className="field">
              {BLOCK_POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {BLOCK_POSITION_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
          <Field label="ترتیب در همان جایگاه" name="sortOrder" type="number" defaultValue={block.sortOrder} />
        </div>
        <label className="mt-5 inline-flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="enabled" defaultChecked={block.enabled} className="size-[18px] accent-brand" />
          فعال
        </label>
      </Card>
      <Card title="محتوا">
        <BlockEditor name="content" initial={block.content} label="محتوای بلوک" />
      </Card>
      <Card title="کجا نمایش داده شود" description="حذف یک افزونه از فهرست «به‌جز» همیشه بر «همه افزونه‌ها» اولویت دارد.">
        <fieldset className="flex flex-wrap gap-5">
          <legend className="sr-only">دامنه نمایش</legend>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="radio" name="scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} className="accent-brand" />
            همه افزونه‌ها
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="radio" name="scope" value="selected" checked={scope === "selected"} onChange={() => setScope("selected")} className="accent-brand" />
            فقط افزونه‌های انتخاب‌شده
          </label>
        </fieldset>
        <div className="mt-5 grid gap-5">
          {scope === "selected" && <PluginChecklist name="includeIds" label="نمایش در این افزونه‌ها" options={options} selected={block.includeIds} />}
          <PluginChecklist name="excludeIds" label="به‌جز این افزونه‌ها" options={options} selected={block.excludeIds} />
        </div>
      </Card>
      <div>
        <SubmitButton>ذخیره بلوک</SubmitButton>
      </div>
    </form>
  );
}
