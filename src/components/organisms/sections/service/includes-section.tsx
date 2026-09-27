import { Icon } from "@/components/atoms";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
};

export function ServiceIncludesSection({ service }: Props) {
  return (
    <section className="section">
      <div className="container-site">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <h2 className="t-h2">این خدمت شامل چه مواردی است؟</h2>
          {service.includesIntro && <p className="max-w-[440px] text-base leading-[1.9] text-muted">{service.includesIntro}</p>}
        </div>
        <ul className="mt-6 grid rounded-md border border-line bg-white px-5 lg:mt-12 lg:grid-cols-2 lg:rounded-xl lg:px-8">
          {service.includes.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 border-b border-line py-5 last:border-b-0 lg:gap-4 lg:py-7 lg:odd:border-l lg:odd:pl-8 lg:even:pr-8 lg:[&:nth-last-child(-n+2):nth-child(odd)]:border-b-0"
            >
              <span aria-hidden="true" className="mt-px flex size-8 shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                <Icon name="check-thin" size={18} />
              </span>
              <div>
                <h3 className="t-h3">{item.title}</h3>
                {item.description && <p className="mt-1 text-base leading-[1.9] text-ink-2">{item.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
