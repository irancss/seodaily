import { ButtonLink, Icon } from "@/components/atoms";
import { vars } from "@/lib/utils";

/** Body of the public site's 404 page: a full-height dark panel under the header. */
export function SiteNotFound() {
  return (
    <section className="surface-dark flex min-h-[calc(100svh-65px)] grow items-center overflow-hidden py-20 lg:min-h-[calc(100svh-77px)] lg:py-24">
      <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "56px" })} />
      <span aria-hidden="true" className="orb orb-blue top-1/2 left-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2" />
      <span aria-hidden="true" className="orb orb-cyan -right-48 -bottom-56 size-[520px]" style={vars({ i: 1 })} />
      <span aria-hidden="true" className="orb orb-blue -top-56 -left-40 size-[440px] opacity-60" style={vars({ i: 2 })} />

      <div className="container-site relative flex flex-col items-center text-center">
        <p className="text-gradient animate-scale text-[112px] leading-[1.1] font-bold sm:text-[150px] lg:text-[190px]">۴۰۴</p>

        {/* A search that came back empty */}
        <div
          aria-hidden="true"
          className="glass-card animate-in mt-2 flex h-12 w-full max-w-[400px] items-center gap-3 rounded-full ps-5 pe-2 text-cyan-300 lg:h-14"
          style={vars({ i: 1 })}
        >
          <Icon name="search-minus" size={20} />
          <span className="block h-2 w-32 rounded-full bg-white/15" />
          <span className="ms-auto flex h-9 items-center rounded-full bg-white/10 px-4 text-xs font-semibold text-inverse-muted lg:h-10">
            ۰ نتیجه
          </span>
        </div>

        <h1 className="t-h2 animate-in mt-8 text-balance lg:mt-10" style={vars({ i: 2 })}>
          صفحه‌ای که دنبالش بودید پیدا نشد
        </h1>
        <p className="body-lg animate-in mt-3 max-w-[560px] lg:mt-4" style={vars({ i: 3 })}>
          ممکن است آدرس تغییر کرده باشد یا صفحه حذف شده باشد.
        </p>
        <div
          className="animate-in mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:mt-10"
          style={vars({ i: 4 })}
        >
          <ButtonLink href="/" variant="white" size="lg" arrow>
            بازگشت به صفحه اصلی
          </ButtonLink>
          <ButtonLink href="/services" variant="glass" size="lg">
            مشاهده خدمات
          </ButtonLink>
          <ButtonLink href="/contact" variant="glass" size="lg">
            درخواست مشاوره
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
