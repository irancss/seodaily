import { Icon } from "@/components/atoms";
import type { Service } from "@/db/schema";
import { CONTENT, TECHNICAL } from "@/modules/pages/seo-content";
import { serviceHref } from "@/modules/services/routes";

import { Half } from "./half";

type Props = {
  /** The technical SEO service, linked from its panel when published. */
  technical?: Service;
  /** The content strategy service, linked from its panel when published. */
  content?: Service;
};

export function SeoTechnicalContentSection({ technical, content }: Props) {
  return (
    <section className="section surface-soft-gradient">
      <div className="container-site relative grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Half
          tone="dark"
          icon="code"
          eyebrow="Technical SEO"
          title="سئوی فنی"
          text="سئوی فنی مطمئن می‌شود موتورهای جست‌وجو بتوانند صفحات سایت را بدون مانع پیدا کنند، بخوانند و درست ایندکس کنند."
          items={TECHNICAL}
          link={technical ? { href: serviceHref(technical.slug), label: "جزئیات سئو تکنیکال" } : undefined}
        />
        <Half
          tone="light"
          icon="file"
          eyebrow="Content SEO"
          title="سئو و محتوا"
          text="محتوا باید به سؤال واقعی مخاطب پاسخ دهد و در ساختاری قرار بگیرد که هم کاربر و هم موتور جست‌وجو مسیرش را بفهمند."
          items={CONTENT}
          link={content ? { href: serviceHref(content.slug), label: "جزئیات استراتژی محتوا" } : undefined}
        />
        {/* The two halves work together. */}
        <span
          aria-hidden="true"
          className="icon-gradient absolute top-1/2 left-1/2 z-10 hidden size-14 -translate-x-1/2 -translate-y-1/2 rounded-full ring-8 ring-[#eef7fe] lg:flex"
        >
          <Icon name="plus" size={24} />
        </span>
      </div>
    </section>
  );
}
