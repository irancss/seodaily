import { SubmitButton } from "@/components/atoms";
import { Card, Field, PageHeader } from "@/components/molecules";
import { createPluginAction } from "@/modules/plugins/actions";

export const metadata = { title: "افزونه جدید" };

export default function NewPlugin() {
  return (
    <>
      <PageHeader title="افزونه جدید" back={{ href: "/admin/plugins", label: "افزونه‌ها" }} description="یک پیش‌نویس ساخته می‌شود؛ تا زمانی که محتوا کامل و نسخه تأییدشده‌ای از فایل آماده نشود، در سایت دیده نمی‌شود." />
      <Card>
        <form action={createPluginAction} method="post" className="grid max-w-xl gap-5">
          <Field label="نام افزونه" name="name" required maxLength={150} />
          <Field label="نامک (اختیاری)" name="slug" dir="ltr" maxLength={80} hint="اگر خالی بماند از نام ساخته می‌شود؛ مثلاً elementor-pro." />
          <div>
            <SubmitButton>ساخت پیش‌نویس</SubmitButton>
          </div>
        </form>
      </Card>
    </>
  );
}
