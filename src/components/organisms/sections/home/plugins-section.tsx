import { ButtonLink } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { PluginGrid } from "@/components/organisms/plugins/plugin-card";
import type { PluginCard } from "@/modules/plugins/queries";

/** The most recently updated plugins; the home page leaves it out while the library is empty. */
export function HomePluginsSection({ plugins }: { plugins: PluginCard[] }) {
  return (
    <section className="section bg-page">
      <div className="container-site">
        <SectionHeading
          eyebrow="افزونه‌های وردپرس"
          title="تازه‌ترین *به‌روزرسانی‌ها*"
          text="فایل اصلی افزونه‌ها با آخرین نسخه، همراه با توضیح فارسی."
          action={
            <ButtonLink href="/plugins" variant="secondary" size="sm" arrow>
              همه افزونه‌ها
            </ButtonLink>
          }
        />
        <PluginGrid plugins={plugins} className="mt-8 lg:mt-12" />
        <ButtonLink href="/plugins" variant="secondary" arrow className="mt-8 w-full lg:hidden">
          همه افزونه‌ها
        </ButtonLink>
      </div>
    </section>
  );
}
