import { ButtonLink, GridBackdrop } from "@/components/atoms";

/** Body of the public site's 404 page. */
export function SiteNotFound() {
  return (
    <section className="relative flex grow items-center overflow-hidden py-24">
      <GridBackdrop fade="radial" className="opacity-60" />
      <div className="container-site relative flex flex-col items-center text-center">
        <span className="text-5xl leading-[1.5] font-bold text-brand">۴۰۴</span>
        <h1 className="t-h2 mt-4">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
        <p className="body-lg mt-4 max-w-[560px]">ممکن است آدرس تغییر کرده باشد یا صفحه حذف شده باشد.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/" arrow>
            بازگشت به صفحه اصلی
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            درخواست مشاوره
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
