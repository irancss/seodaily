import { ButtonLink } from "@/components/atoms";
import { CtaSection } from "@/components/organisms";

export function ProjectCtaSection({ padTop = false }: { padTop?: boolean }) {
  return (
    <CtaSection
      padTop={padTop}
      eyebrow="شروع همکاری"
      title="پروژه‌ای در ذهن دارید؟"
      text="اطلاعات اولیه پروژه را برای ما بفرستید تا نیازها و شرایط آن بررسی شود."
      secondary={
        <ButtonLink href="/portfolio" variant="glass" size="lg" className="w-full sm:w-auto lg:w-full">
          مشاهده نمونه‌کارها
        </ButtonLink>
      }
    />
  );
}
