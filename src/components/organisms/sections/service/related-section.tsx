import Link from "next/link";

import { ArrowBadge } from "@/components/atoms";
import type { Service } from "@/db/schema";
import { serviceHref } from "@/modules/services/routes";

type Props = {
  related: Pick<Service, "slug" | "title" | "category">[];
};

export function ServiceRelatedSection({ related }: Props) {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="container-site">
        <h2 className="t-h2">خدمات مرتبط</h2>
        <ul className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-6">
          {related.map((r) => (
            <li key={r.slug}>
              <Link
                href={serviceHref(r.slug)}
                className="card-link flex min-h-[72px] items-center justify-between gap-3 rounded-md border border-line bg-page px-5 py-3 text-ink no-underline hover:text-ink lg:h-[104px] lg:gap-4 lg:px-7 lg:py-0"
              >
                <span className="flex flex-col">
                  <span className="text-sm leading-[1.7] font-medium text-muted">
                    {r.category === "seo" ? "سئو" : "طراحی سایت"}
                  </span>
                  <span className="card-title text-lg leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">{r.title}</span>
                </span>
                <span className="lg:hidden">
                  <ArrowBadge size={40} variant="soft" />
                </span>
                <span className="hidden lg:block">
                  <ArrowBadge variant="soft" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
