import { PageHero } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

import { ContactHeroVisual } from "./hero-visual";

type Props = {
  text: PageText;
  phone: string;
};

export function ContactHeroSection({ text, phone }: Props) {
  return (
    <PageHero
      tone="light"
      breadcrumb={[{ label: "صفحه اصلی", href: "/" }, { label: "تماس با ما" }]}
      badge={text.badge}
      title={text.title}
      subtitle={text.subtitle}
      aside={<ContactHeroVisual phone={phone} />}
    />
  );
}
