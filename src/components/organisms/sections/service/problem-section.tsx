import { Icon } from "@/components/atoms";
import type { Service } from "@/db/schema";

import { PROBLEM_ICONS } from "./icons";

type Props = {
  service: Service;
};

export function ServiceProblemSection({ service }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site grid items-start gap-8 lg:grid-cols-[460px_minmax(0,1fr)] lg:gap-24">
        <div className="flex flex-col gap-3 lg:gap-5">
          <h2 className="t-h2">این خدمت چه مشکلی را حل می‌کند؟</h2>
          {service.problemIntro && <p className="body-lg">{service.problemIntro}</p>}
        </div>
        {service.problems.length > 0 && (
          <ul className="border-t border-line">
            {service.problems.map((p, i) => (
              <li key={i} className="flex items-center gap-4 border-b border-line py-5 lg:gap-5 lg:py-6">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                  <Icon name={PROBLEM_ICONS[i % PROBLEM_ICONS.length]} />
                </span>
                <p className="text-lg leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">{p}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
