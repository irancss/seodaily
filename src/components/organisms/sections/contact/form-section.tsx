import { Icon } from "@/components/atoms";
import { ContactForm } from "@/components/organisms";
import type { ContactSettings, PageText } from "@/modules/settings/types";

import { ContactDirectSection } from "./direct-section";
import { ContactNextSteps } from "./next-steps";

type Props = {
  budgets: string[];
  defaultService?: string;
  text: PageText;
  contact: ContactSettings;
};

/**
 * Form panel beside a side column (direct channels + next steps). The form
 * comes first in the document and on phones; on desktop it sits on the left.
 */
export function ContactFormSection({ budgets, defaultService, text, contact }: Props) {
  return (
    <section className="relative z-10 -mt-4 pb-16 lg:-mt-10 lg:pb-24">
      <div className="container-site grid items-start gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-8">
        <div className="relative rounded-2xl border border-line bg-white px-5 py-7 shadow-lg sm:p-8 lg:col-start-2 lg:row-start-1 lg:p-10">
          <span aria-hidden="true" className="absolute inset-x-8 top-0 h-1 rounded-b-full bg-gradient-to-l from-brand to-brand-decorative" />
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="icon-gradient size-12 rounded-[14px]">
              <Icon name="message" size={22} />
            </span>
            <div>
              <h2 id="cf-title" className="text-xl leading-[1.65] font-bold lg:text-2xl lg:leading-[1.6]">
                فرم درخواست مشاوره
              </h2>
              <p className="mt-1 text-sm leading-[1.8] text-muted">
                فیلدهای ستاره‌دار (<span aria-hidden="true" className="text-error">*</span>) الزامی هستند.
              </p>
            </div>
          </div>
          {/* On phones the channels come after the long form. */}
          <p className="mt-5 flex flex-wrap items-center gap-x-2 rounded-xl bg-soft px-4 py-2 text-sm leading-[1.8] text-ink lg:hidden">
            ترجیح می‌دهید مستقیم در ارتباط باشید؟
            <a href="#contact-direct" className="inline-flex min-h-10 items-center gap-1 font-semibold">
              مشاهده راه‌های ارتباطی
              <Icon name="arrow-down" size={16} />
            </a>
          </p>
          <ContactForm budgets={budgets} defaultService={defaultService} />
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-28 lg:col-start-1 lg:row-start-1">
          <ContactDirectSection text={text} contact={contact} />
          <ContactNextSteps />
        </div>
      </div>
    </section>
  );
}
