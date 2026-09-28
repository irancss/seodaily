import { SubmitButton } from "@/components/atoms";
import { Card, Field, ImageField } from "@/components/molecules";
import { Repeater } from "@/components/organisms/repeater";
import { saveGeneral } from "@/modules/settings/actions";
import type { GeneralSettings } from "@/modules/settings/types";

export function GeneralSettingsForm({ general }: { general: GeneralSettings }) {
  return (
    <Card title="عمومی و سئو">
      <form action={saveGeneral} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="نام سایت" name="siteName" defaultValue={general.siteName} required />
          <Field
            label="آدرس اصلی سایت"
            name="siteUrl"
            defaultValue={general.siteUrl}
            dir="ltr"
            placeholder="https://seodaily.ir"
            hint="برای canonical، نقشه سایت و Open Graph لازم است."
          />
        </div>
        <Field
          label="کد تأیید Google Search Console"
          name="googleVerification"
          defaultValue={general.googleVerification}
          dir="ltr"
          hint="مقدار content در تگ google-site-verification (یا کل تگ را بچسبانید)."
        />
        <ImageField label="تصویر پیش‌فرض اشتراک‌گذاری (Open Graph)" name="ogImage" current={general.ogImage || undefined} hint="۱۲۰۰×۶۳۰ پیکسل. وقتی صفحه تصویر خودش را ندارد، در پیش‌نمایش لینک‌ها استفاده می‌شود." />
        <Field label="توضیح فوتر" name="footerDescription" defaultValue={general.footerDescription} multiline rows={2} />
        <Field label="متن کوتاه پایین فوتر" name="footerNote" defaultValue={general.footerNote} />
        <Repeater
          name="industries"
          label="صنف‌ها (بخش «برای کسب‌وکارهای مختلف» صفحه اصلی)"
          hint="لینک اختیاری است؛ اگر برای این صنف صفحه مرتبطی دارید (مثلاً /services/online-store) وارد کنید، وگرنه خالی بگذارید تا فقط به‌صورت برچسب نمایش داده شود."
          fields={[{ key: "title", label: "عنوان" }, { key: "url", label: "لینک (مثلاً /services/online-store)", dir: "ltr" }]}
          initial={general.industries}
        />
        <Field label="بازه‌های بودجه فرم مشاوره (هر خط یک گزینه)" name="budgets" defaultValue={general.budgets.join("\n")} multiline rows={4} hint="اگر خالی باشد، فیلد بودجه در فرم نمایش داده نمی‌شود." />
        <Field label="گزینه‌های فناوری صفحه طراحی سایت (هر خط یک گزینه)" name="techOptions" defaultValue={general.techOptions.join("\n")} multiline rows={3} />
        <div><SubmitButton /></div>
      </form>
    </Card>
  );
}
