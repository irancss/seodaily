import { CtaSection } from "@/components/organisms";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
  /** The panel needs its own top spacing when the section above is not on the page colour. */
  padTop?: boolean;
  phone: string;
};

export function ServiceCtaSection({ service, padTop = false, phone }: Props) {
  return (
    <CtaSection
      phone={phone}
      padTop={padTop}
      eyebrow="شروع همکاری"
      title={`برای شروع *${service.title}*، درباره پروژه‌تان صحبت کنیم`}
      text="اطلاعات اولیه پروژه را ارسال کنید تا نیازها و شرایط آن بررسی شود."
    />
  );
}
