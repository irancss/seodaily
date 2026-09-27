import Link from "next/link";

import { Badge, Icon } from "@/components/atoms";
import { Card } from "@/components/molecules";
import { EstimateItemsEditor } from "@/components/organisms/admin/estimate-items-editor";
import type { Lead } from "@/db/schema";
import { itemTitle } from "@/modules/leads/estimate";
import { formatNumber, formatPrice, formatTotal } from "@/modules/pricing/format";
import { PRICING_SERVICE_LABELS } from "@/modules/pricing/types";

/** The lead's estimate breakdown, its line editor and the way to the contract. */
export function LeadEstimate({ lead }: { lead: Lead }) {
  const estimate = lead.estimate;
  return (
    <Card
      title="برآورد هزینه"
      description={estimate ? undefined : "این درخواست برآوردی ندارد. برای ساخت قرارداد، اقلام و مبالغ را وارد کنید."}
    >
      {estimate && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={estimate.source === "calculator" ? "blue" : "gray"}>
              {estimate.source === "calculator" ? "ثبت‌شده با ماشین‌حساب سایت" : "ویرایش‌شده در پنل"}
            </Badge>
            <Badge>{PRICING_SERVICE_LABELS[estimate.service]}</Badge>
          </div>
          <div className="mt-4 overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[520px] text-right text-sm">
              <thead className="bg-page text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    شرح
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    تعداد
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    مبلغ واحد
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    مبلغ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {estimate.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2.5">{itemTitle(item)}</td>
                    <td className="px-3 py-2.5 text-ink-2">{formatNumber(item.qty)}</td>
                    <td className="px-3 py-2.5 text-ink-2">{formatPrice(item.unitPrice)}</td>
                    <td className="px-3 py-2.5 font-medium">{formatPrice(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-line bg-page">
                <tr>
                  <th scope="row" colSpan={3} className="px-3 py-2.5 text-right font-bold">
                    جمع کل
                  </th>
                  <td className="px-3 py-2.5 font-bold">{formatTotal(estimate.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      <details open={!estimate} className="mt-5 rounded-md border border-line">
        <summary className="flex min-h-12 items-center justify-between gap-3 px-4 text-sm font-semibold">
          {estimate ? "ویرایش اقلام برآورد" : "افزودن اقلام برآورد"}
          <Icon name="chevron-down" size={18} />
        </summary>
        <div className="border-t border-line p-4">
          <EstimateItemsEditor leadId={lead.id} items={estimate?.items ?? []} />
        </div>
      </details>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href={`/admin/leads/${lead.id}/contract`} className="btn btn-secondary h-11 px-5 text-sm">
          <Icon name="doc-check" size={18} />
          ساخت قرارداد
        </Link>
        <span className="text-xs leading-[1.8] text-muted">قرارداد از روی قالب خدمت و همین اقلام ساخته می‌شود.</span>
      </div>
    </Card>
  );
}
