import Link from "next/link";

import { cx } from "@/lib/utils";
import { PRICING_SERVICE_LABELS, PRICING_SERVICES, type PricingService } from "@/modules/pricing/types";

/** Pills switching an admin page (pricing, contracts, a contract's template) between the services. */
export function AdminServiceTabs({
  basePath,
  current,
  param = "service",
  anchor,
  label = "انتخاب خدمت",
}: {
  basePath: string;
  current: PricingService;
  /** Query parameter that carries the service. */
  param?: string;
  anchor?: string;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap gap-2">
      {PRICING_SERVICES.map((service) => (
        <Link
          key={service}
          href={`${basePath}?${param}=${service}${anchor ? `#${anchor}` : ""}`}
          aria-current={service === current ? "page" : undefined}
          className={cx(
            "rounded-full border px-4 py-1.5 text-sm font-medium no-underline",
            service === current ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink-2",
          )}
        >
          {PRICING_SERVICE_LABELS[service]}
        </Link>
      ))}
    </nav>
  );
}
