import { Icon } from "@/components/atoms";
import { ContactForm } from "@/components/organisms";
import { stepNo } from "@/lib/utils";
import { NEXT_STEPS } from "@/modules/pages/contact-content";

type Props = {
  budgets: string[];
  defaultService?: string;
};

export function ContactFormSection({ budgets, defaultService }: Props) {
  return (
    <section className="lg:pb-24">
      <div className="container-site grid items-start gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] lg:gap-12">
        <div className="rounded-xl border border-line bg-white px-5 py-6 sm:p-10">
          <h2 id="cf-title" className="text-xl leading-[1.65] font-semibold lg:text-2xl lg:leading-[1.6] lg:font-bold">
            فرم درخواست مشاوره
          </h2>
          <p className="mt-1 text-sm leading-[1.8] text-muted lg:mt-2">
            فیلدهای ستاره‌دار (<span aria-hidden="true" className="text-error">*</span>) الزامی هستند.
          </p>
          <ContactForm budgets={budgets} defaultService={defaultService} />
        </div>

        {/* Mobile: the next steps become a full-width band after the form. */}
        <div className="-mx-5 flex flex-col gap-4 lg:sticky lg:top-24 lg:mx-0">
          <section aria-labelledby="ns-title" className="bg-soft px-5 py-16 lg:rounded-xl lg:p-10">
            <h2 id="ns-title" className="text-2xl leading-[1.6] font-bold">
              بعد از ارسال درخواست چه اتفاقی می‌افتد؟
            </h2>
            <ol className="relative mt-6 flex flex-col gap-6 lg:mt-8 lg:gap-7">
              <li aria-hidden="true" className="absolute top-[22px] right-[21px] bottom-[22px] w-0.5 bg-brand/25" />
              {NEXT_STEPS.map((step, i) => (
                <li key={step} className="relative grid grid-cols-[44px_minmax(0,1fr)] items-start gap-4">
                  <span className="flex size-11 items-center justify-center rounded-full border-2 border-brand bg-white text-base leading-normal font-bold text-brand">
                    {stepNo(i)}
                  </span>
                  <p className="pt-1.5 text-base leading-[1.9] text-ink">{step}</p>
                </li>
              ))}
            </ol>
          </section>
          <div className="hidden flex-col gap-1 rounded-md border border-line bg-white p-6 lg:flex">
            <p className="text-base leading-[1.9] font-semibold text-ink">ترجیح می‌دهید مستقیم در ارتباط باشید؟</p>
            <a href="#contact-direct" className="text-link self-start">
              مشاهده راه‌های ارتباطی
              <Icon name="arrow-down" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
