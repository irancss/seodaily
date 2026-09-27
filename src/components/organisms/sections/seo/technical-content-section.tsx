import type { Service } from "@/db/schema";
import { CONTENT, TECHNICAL } from "@/modules/pages/seo-content";
import { serviceHref } from "@/modules/services/routes";

import { Half } from "./half";

type Props = {
  /** The technical SEO service, linked from its half when published. */
  technical?: Service;
  /** The content strategy service, linked from its half when published. */
  content?: Service;
};

export function SeoTechnicalContentSection({ technical, content }: Props) {
  return (
    <section className="grid border-y border-line lg:grid-cols-2">
      <Half
        tone="white"
        icon="code"
        eyebrow="Technical SEO"
        title="سئوی فنی"
        text="سئوی فنی مطمئن می‌شود موتورهای جست‌وجو بتوانند صفحات سایت را بدون مانع پیدا کنند، بخوانند و درست ایندکس کنند."
        items={TECHNICAL}
        link={technical ? { href: serviceHref(technical.slug), label: "جزئیات سئو تکنیکال" } : undefined}
      />
      <Half
        tone="soft"
        icon="file"
        eyebrow="Content SEO"
        title="سئو و محتوا"
        text="محتوا باید به سؤال واقعی مخاطب پاسخ دهد و در ساختاری قرار بگیرد که هم کاربر و هم موتور جست‌وجو مسیرش را بفهمند."
        items={CONTENT}
        link={content ? { href: serviceHref(content.slug), label: "جزئیات استراتژی محتوا" } : undefined}
      />
    </section>
  );
}
