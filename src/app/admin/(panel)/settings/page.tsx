import { Repeater } from "@/components/organisms";
import { SubmitButton } from "@/components/atoms";
import { Card, Field, Flash, ImageField, PageHeader } from "@/components/molecules";
import { getContact, getGeneral } from "@/modules/settings/queries";

import { saveContact, saveGeneral } from "@/modules/settings/actions";

export const metadata = { title: "تنظیمات سایت" };

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, general, contact] = await Promise.all([searchParams, getGeneral(), getContact()]);
  return (
    <>
      <PageHeader title="تنظیمات سایت" />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex flex-col gap-6">
        <Card title="اطلاعات تماس" description="در فوتر، صفحه تماس و داده‌های ساختاریافته (Schema) استفاده می‌شود.">
          <form action={saveContact} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="تلفن" name="phone" defaultValue={contact.phone} dir="ltr" />
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
              hint="لینک اختیاری است؛ خالی بماند به صفحه تماس می‌رود."
              fields={[{ key: "title", label: "عنوان" }, { key: "url", label: "لینک (مثلاً /services/online-store)", dir: "ltr" }]}
              initial={general.industries}
            />
            <Field label="بازه‌های بودجه فرم مشاوره (هر خط یک گزینه)" name="budgets" defaultValue={general.budgets.join("\n")} multiline rows={4} hint="اگر خالی باشد، فیلد بودجه در فرم نمایش داده نمی‌شود." />
            <Field label="گزینه‌های فناوری صفحه طراحی سایت (هر خط یک گزینه)" name="techOptions" defaultValue={general.techOptions.join("\n")} multiline rows={3} />
            <div><SubmitButton /></div>
          </form>
        </Card>
      </div>
    </>
  );
}
