import { SubmitButton } from "@/components/atoms";
import { Card, Field } from "@/components/molecules";
import { Repeater } from "@/components/organisms/repeater";
import { saveContact } from "@/modules/settings/actions";
import { DEFAULT_CONTACT } from "@/modules/settings/defaults";
import type { ContactSettings } from "@/modules/settings/types";

export function ContactSettingsForm({ contact }: { contact: ContactSettings }) {
  return (
    <Card title="اطلاعات تماس" description="در فوتر، صفحه تماس و داده‌های ساختاریافته (Schema) استفاده می‌شود.">
      <form action={saveContact} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="تلفن و موبایل"
            name="phone"
            defaultValue={contact.phone}
            dir="ltr"
            hint={`در هدر، فوتر، دکمه تماس موبایل و بخش‌های «تماس» نمایش داده می‌شود. اگر خالی بماند، ${DEFAULT_CONTACT.phone} استفاده می‌شود.`}
          />
          <Field label="ایمیل" name="email" type="email" defaultValue={contact.email} dir="ltr" />
        </div>
        <Field label="آدرس" name="address" defaultValue={contact.address} multiline rows={2} />
        <Repeater
          name="socials"
          label="شبکه‌های اجتماعی"
          fields={[{ key: "title", label: "نام (مثلاً اینستاگرام)" }, { key: "url", label: "لینک", dir: "ltr" }]}
          initial={contact.socials}
        />
        <div><SubmitButton /></div>
      </form>
    </Card>
  );
}
