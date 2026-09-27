import { Icon } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { StepsTimeline } from "@/components/organisms";
import { METHOD } from "@/modules/pages/about-content";

export function AboutMethodSection() {
  return (
    <section className="section surface-soft-gradient">
      <div className="container-site">
        <SectionHeading
          eyebrow="روش کار"
          title="چطور *کار* می‌کنیم؟"
          text="هر مرحله خروجی مشخصی دارد و ورودی مرحله بعد است."
        />
        <StepsTimeline className="mt-10 lg:mt-14" steps={METHOD.map(([title, description]) => ({ title, description }))} />
        <p className="reveal mt-6 flex items-start gap-3 rounded-xl border border-brand/15 bg-white/70 p-4 text-base leading-[1.9] text-ink backdrop-blur lg:mt-8 lg:items-center lg:justify-center lg:p-5">
          <span aria-hidden="true" className="icon-gradient size-9 rounded-full shadow-none">
            <Icon name="cycle-right" size={18} />
          </span>
          بهبود، نقطه شروع دور بعدی تحلیل است؛ این چرخه در طول همکاری ادامه پیدا می‌کند.
        </p>
      </div>
    </section>
  );
}
