import Link from "next/link";

import { LEAD_STATUSES, type LeadStatus } from "@/db/schema";
import { cx } from "@/lib/utils";
import { leadsHref } from "@/modules/admin/leads-routes";
import { STATUS_LABELS } from "@/modules/leads/status";

/** Status pills above the leads table; `status` is the active filter. */
export function LeadsFilter({ status }: { status?: LeadStatus }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {[undefined, ...LEAD_STATUSES].map((s) => (
        <Link
          key={s ?? "all"}
          href={leadsHref(s)}
          className={cx(
            "rounded-full border px-4 py-1.5 text-sm font-medium no-underline",
            status === s ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink-2",
          )}
        >
          {s ? STATUS_LABELS[s] : "همه"}
        </Link>
      ))}
    </div>
  );
}
