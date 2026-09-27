import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/atoms";
import { AdminServiceTabs } from "@/components/organisms/admin/service-tabs";
import type { LeadContract } from "@/modules/contracts/render";
import type { ContractSettings } from "@/modules/contracts/types";

/** Template switcher and what to fix before printing (hidden from the printout). */
export function ContractToolbar({ leadId, contract, settings }: { leadId: number; contract: LeadContract; settings: ContractSettings }) {
  const leadHref = `/admin/leads/${leadId}`;
  const notes: ReactNode[] = [];
  if (!settings.company.name) {
    notes.push(
      <>
        مشخصات مجری هنوز وارد نشده است؛ آن را در <Link href="/admin/contracts">قالب قرارداد</Link> تکمیل کنید.
      </>,
    );
  }
  if (contract.items.length === 0) {
    notes.push(
      <>
        این درخواست اقلام برآورد ندارد، پس جدول و مبلغ قرارداد خالی چاپ می‌شود؛ اقلام را در <Link href={leadHref}>صفحه درخواست</Link> وارد کنید.
      </>,
    );
  } else if (contract.items.some((item) => item.amount === 0)) {
    notes.push(
      <>
        برخی اقلام «توافقی» هستند و در جمع حساب نشده‌اند؛ پیش از چاپ، مبلغ آن‌ها را در <Link href={leadHref}>صفحه درخواست</Link> وارد کنید.
      </>,
    );
  }
  if (!settings.customized[contract.service]) {
    notes.push(
      <>
        متن این قرارداد همان نمونه پیش‌فرض است؛ پیش از استفاده، آن را در{" "}
        <Link href={`/admin/contracts?service=${contract.service}`}>قالب قرارداد</Link> بازبینی کنید.
      </>,
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div>
        <p className="mb-2 text-sm font-medium text-ink-2">قالب قرارداد</p>
        <AdminServiceTabs basePath={`/admin/leads/${leadId}/contract`} current={contract.service} param="template" label="انتخاب قالب قرارداد" />
      </div>
      {notes.length > 0 && (
        <ul className="flex flex-col gap-2 rounded-md border border-warning-bg bg-warning-bg p-4 text-sm leading-[1.9] text-warning">
          {notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <Icon name="alert" size={16} className="mt-1 shrink-0" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
