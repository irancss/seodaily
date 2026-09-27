import { FACTORS } from "@/modules/pages/seo-content";

export function SeoExpectationsSection() {
  return (
    <section className="section">
      <div className="container-site">
        <div aria-hidden="true" className="relative h-px bg-line">
          <span className="absolute -top-px right-0 h-[3px] w-20 bg-brand lg:w-[120px]" />
        </div>
        <span className="mt-6 block text-sm leading-[1.7] font-medium text-brand-hover lg:mt-8">انتظار واقع‌بینانه از سئو</span>
        <h2 className="t-h1 mt-3 max-w-[980px] lg:mt-4">سئو یک پروژه کوتاه‌مدت با نتیجه تضمینی نیست</h2>
        {/* Mobile order: statement, factors, then the explanation. */}
        <div className="mt-5 flex flex-col lg:mt-10 lg:grid lg:grid-cols-[7fr_5fr] lg:items-start lg:gap-16">
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            <p className="text-base leading-[1.9] text-ink lg:text-lg">
              سرعت و میزان نتیجه به عوامل مختلفی مانند وضعیت فعلی سایت، رقابت بازار، منابع پروژه و سابقه دامنه
              وابسته است.
            </p>
            <p className="order-last mt-6 text-base leading-[1.9] text-ink-2 lg:mt-0">
              به همین دلیل در هیچ مرحله‌ای از همکاری، زمان یا رتبه مشخصی وعده داده نمی‌شود. به‌جای آن، برنامه کار و
              معیارهای سنجش پیشرفت از ابتدا شفاف تعریف می‌شوند.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 lg:mt-0">
            <span className="text-sm leading-[1.7] font-medium text-muted">عوامل اثرگذار بر مسیر پروژه</span>
            <ul className="flex flex-wrap gap-2">
              {FACTORS.map((f) => (
                <li key={f} className="pill px-3.5 py-1 lg:px-4 lg:py-1.5">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
