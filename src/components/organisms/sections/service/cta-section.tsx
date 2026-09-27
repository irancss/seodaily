import { CtaSection } from "@/components/organisms";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
};

export function ServiceCtaSection({ service }: Props) {
  return (
    <CtaSection
      padTop={service.faqs.length === 0}
      title={`برای شروع ${service.title}، درباره پروژه‌تان صحبت کنیم`}
      text="اطلاعات اولیه پروژه را ارسال کنید تا نیازها و شرایط آن بررسی شود."
    />
  );
}
