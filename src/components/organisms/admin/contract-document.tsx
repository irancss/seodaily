import type { EstimateItem } from "@/db/schema";
import type { ContractBlock, ContractValues, LeadContract } from "@/modules/contracts/render";
import { itemTitle } from "@/modules/leads/estimate";
import { formatNumber } from "@/modules/pricing/format";

const CELL = "border border-line-strong px-2 py-1.5 align-top print:border-black";
const HEAD = `${CELL} bg-page font-bold print:bg-transparent`;
/** Rows left for writing by hand when the lead has no estimate yet. */
const BLANK_ROWS = 4;

function money(n: number) {
  return n > 0 ? formatNumber(n) : "توافقی";
}

function ItemsTable({ items, total }: { items: EstimateItem[]; total: number }) {
  return (
    <div className="my-3 overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-[520px] border-collapse text-right text-[14px] leading-7 print:min-w-0 print:text-[10.5pt]">
        <thead>
          <tr className="break-inside-avoid">
            <th scope="col" className={`${HEAD} w-12 text-center`}>
              ردیف
            </th>
            <th scope="col" className={HEAD}>
              شرح خدمات
            </th>
            <th scope="col" className={`${HEAD} w-16 text-center`}>
              تعداد
            </th>
            <th scope="col" className={HEAD}>
              مبلغ واحد (تومان)
            </th>
            <th scope="col" className={HEAD}>
              مبلغ (تومان)
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0
            ? items.map((item, i) => (
                <tr key={i} className="break-inside-avoid">
                  <td className={`${CELL} text-center`}>{formatNumber(i + 1)}</td>
                  <td className={CELL}>{itemTitle(item)}</td>
                  <td className={`${CELL} text-center`}>{formatNumber(item.qty)}</td>
                  <td className={CELL}>{money(item.unitPrice)}</td>
                  <td className={CELL}>{money(item.amount)}</td>
                </tr>
              ))
            : Array.from({ length: BLANK_ROWS }, (_, i) => (
                <tr key={i} className="h-10 break-inside-avoid">
                  <td className={`${CELL} text-center`}>{formatNumber(i + 1)}</td>
                  <td className={CELL} />
                  <td className={CELL} />
                  <td className={CELL} />
                  <td className={CELL} />
                </tr>
              ))}
        </tbody>
        <tfoot>
          <tr className="break-inside-avoid">
            <th scope="row" colSpan={4} className={`${HEAD} text-right`}>
              جمع کل
            </th>
            <td className={`${CELL} font-bold`}>{total > 0 ? formatNumber(total) : ""}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Signatures({ values }: { values: ContractValues }) {
  const line = "mt-12 border-t border-dashed border-line-strong pt-2 text-sm text-muted print:border-black print:text-black";
  return (
    <div className="mt-10 grid grid-cols-2 gap-6 break-inside-avoid sm:gap-10">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-bold">کارفرما</p>
        <p>{values.client_name}</p>
        <p className="text-sm">{values.client_business}</p>
        <p className={line}>امضا</p>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-bold">مجری</p>
        <p>{values.company_name}</p>
        <p className="text-sm">
          {values.signatory} ({values.signatory_title})
        </p>
        <p className={line}>مهر و امضا</p>
      </div>
    </div>
  );
}

function Block({ block, contract }: { block: ContractBlock; contract: LeadContract }) {
  switch (block.type) {
    case "title":
      return <h2 className="mb-4 text-center text-xl leading-[1.8] font-bold print:text-[15pt]">{block.text}</h2>;
    case "heading":
      return <h3 className="mt-5 text-base leading-[1.9] font-bold break-after-avoid print:text-[11.5pt]">{block.text}</h3>;
    case "paragraph":
      return <p className="mt-1.5 text-justify whitespace-pre-line">{block.text}</p>;
    case "list":
      return (
        <ul className="mt-1.5 list-disc ps-6">
          {block.items.map((item, i) => (
            <li key={i} className="mt-1">
              {item}
            </li>
          ))}
        </ul>
      );
    case "items_table":
      return <ItemsTable items={contract.items} total={contract.total} />;
    case "signatures":
      return <Signatures values={contract.values} />;
  }
}

/** The printable contract: an A4 sheet on screen, plain page content when printed. */
export function ContractDocument({ contract }: { contract: LeadContract }) {
  return (
    <article className="mx-auto w-full max-w-[210mm] rounded-md bg-white px-5 py-8 text-[15px] leading-8 text-ink shadow-md sm:px-[16mm] sm:py-[14mm] print:max-w-none print:rounded-none print:p-0 print:text-[10.5pt] print:leading-[1.9] print:text-black print:shadow-none">
      {contract.blocks.map((block, i) => (
        <Block key={i} block={block} contract={contract} />
      ))}
    </article>
  );
}
