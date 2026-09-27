import { stepNo, vars } from "@/lib/utils";
import { NEXT_STEPS } from "@/modules/pages/contact-content";

/** «What happens next» card of the contact page's side column. */
export function ContactNextSteps() {
  return (
    <section aria-labelledby="ns-title" className="surface-dark overflow-hidden rounded-2xl p-6 lg:p-7">
      <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "28px" })} />
      <span aria-hidden="true" className="orb orb-blue -top-32 -left-24 size-[320px]" />
      <span aria-hidden="true" className="orb orb-cyan -right-24 -bottom-40 size-[300px]" style={vars({ i: 1 })} />

      <h2 id="ns-title" className="text-xl leading-[1.65] font-bold text-balance lg:text-2xl lg:leading-[1.6]">
        بعد از ارسال درخواست چه اتفاقی می‌افتد؟
      </h2>
      <ol className="relative mt-6 flex flex-col gap-5">
        <span aria-hidden="true" className="absolute top-5 right-[19px] bottom-5 w-0.5 rounded-full bg-white/10">
          <span className="step-line step-line-v grow-y" />
        </span>
        {NEXT_STEPS.map((step, i) => (
          <li key={step} className="relative grid grid-cols-[40px_minmax(0,1fr)] items-start gap-4">
            <span className="step-dot size-10 text-sm lg:size-10 lg:text-sm">{stepNo(i)}</span>
            <p className="pt-1.5 text-base leading-[1.9] text-slate-100">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
