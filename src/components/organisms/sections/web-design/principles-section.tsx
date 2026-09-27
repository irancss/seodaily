import { IconTile } from "@/components/atoms";
import { PRINCIPLES } from "@/modules/pages/web-design-content";

export function WebDesignPrinciplesSection() {
  return (
    <section className="section">
      <div className="container-site grid items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-24">
        <div className="flex flex-col gap-3 lg:gap-4">
          <h2 className="t-h2">در طراحی سایت چه چیزهایی برای ما مهم است؟</h2>
          <p className="body-lg">
            ظاهر سایت فقط یک بخش از کار است. این شش اصل در طراحی و پیاده‌سازی همه صفحات کنار هم در نظر گرفته
            می‌شوند.
          </p>
        </div>
        <ul className="grid border-b border-line sm:grid-cols-2 sm:gap-x-12">
          {PRINCIPLES.map(([icon, title, body]) => (
            <li key={title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 border-t border-line py-5 lg:grid-cols-[44px_minmax(0,1fr)] lg:py-7">
              <IconTile name={icon} iconSize={20} round tone="white" className="size-10 lg:size-11" />
              <div>
                <h3 className="t-h3">{title}</h3>
                <p className="mt-1 text-base leading-[1.9] text-ink-2">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
