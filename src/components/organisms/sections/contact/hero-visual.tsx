import { Icon } from "@/components/atoms";
import { formatPhone, vars } from "@/lib/utils";
import { NEXT_STEPS } from "@/modules/pages/contact-content";

/** Desktop-only picture beside the contact hero: a call with its first step and the direct line. */
export function ContactHeroVisual({ phone }: { phone: string }) {
  return (
    <div aria-hidden="true" className="relative mx-auto hidden h-[360px] w-full max-w-[500px] lg:block">
      {/* Rings around the call */}
      <div className="absolute top-1/2 left-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 rounded-full border border-brand/10 bg-white/30" />
        <span className="absolute inset-[16%] rounded-full border border-brand/15 bg-white/50" />
        <span className="absolute inset-[32%] rounded-full border border-brand/20 bg-soft" />
        <span className="icon-gradient absolute inset-[38%] rounded-full shadow-brand">
          <Icon name="phone" size={34} strokeWidth={1.75} />
        </span>
      </div>

      {/* A message on its way */}
      <div className="float-card float absolute top-6 right-2 flex items-center gap-3 py-3 ps-3 pe-5" style={vars({ i: 2 })}>
        <span className="icon-gradient size-9 rounded-xl">
          <Icon name="message" size={16} />
        </span>
        <span className="flex gap-1">
          <span className="size-1.5 rounded-full bg-brand" />
          <span className="size-1.5 rounded-full bg-brand/60" />
          <span className="size-1.5 rounded-full bg-brand/30" />
        </span>
      </div>

      {/* What happens first */}
      <div className="float-card float absolute top-16 -left-4 flex items-center gap-3 py-3 ps-3 pe-5" style={vars({ i: 0 })}>
        <span className="flex size-9 items-center justify-center rounded-full bg-success-bg text-success">
          <Icon name="check" size={18} strokeWidth={2.5} />
        </span>
        <span className="css-label text-sm leading-[1.7] font-semibold text-ink" data-label={NEXT_STEPS[0]} />
      </div>

      {/* Direct line */}
      {phone && (
        <div className="float-card float absolute right-6 bottom-4 flex items-center gap-3 py-3 ps-3 pe-5" style={vars({ i: 1 })}>
          <span className="flex size-10 items-center justify-center rounded-full bg-soft text-brand">
            <Icon name="phone" size={18} />
          </span>
          <span className="flex flex-col">
            <span className="text-xs leading-[1.7] text-muted"><span className="css-label" data-label="تماس مستقیم" /></span>
            <span dir="ltr" className="text-sm leading-[1.7] font-bold text-ink">
              <span className="css-label" data-label={formatPhone(phone)} />
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
