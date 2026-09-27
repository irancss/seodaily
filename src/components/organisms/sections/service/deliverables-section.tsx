import { Icon } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";

import { DELIVERABLE_ICONS } from "./icons";

type Props = {
  service: Service;
};

export function ServiceDeliverablesSection({ service }: Props) {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading align="stack" title="در پایان چه چیزی دریافت می‌کنید؟" text={service.deliverablesIntro || undefined} />
        <div className="mt-6 overflow-hidden rounded-md border border-line bg-white lg:mt-12 lg:rounded-xl">
          <div className="flex h-12 items-center gap-2 border-b border-line bg-page px-5 text-sm leading-[1.7] font-medium text-muted lg:h-14 lg:px-10">
            <Icon name="checklist" size={18} />
            فهرست تحویلی — {service.title}
          </div>
          <ul className="grid px-5 lg:grid-cols-2 lg:px-0">
            {service.deliverables.map((d, i) => (
              <li
                key={i}
                className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 border-b border-line py-5 last:border-b-0 lg:grid-cols-[56px_minmax(0,1fr)] lg:gap-5 lg:p-10 lg:odd:border-l lg:[&:nth-last-child(-n+2):nth-child(odd)]:border-b-0"
              >
                <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-md bg-soft text-brand lg:size-14">
                  <Icon name={DELIVERABLE_ICONS[i % DELIVERABLE_ICONS.length]} size={24} strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="t-h3">{d.title}</h3>
                  {d.description && <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{d.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
