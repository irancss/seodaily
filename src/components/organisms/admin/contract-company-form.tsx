import { SubmitButton } from "@/components/atoms";
import { Card, Field } from "@/components/molecules";
import { saveContractCompany } from "@/modules/contracts/actions";
import type { ContractCompany } from "@/modules/contracts/types";

export function ContractCompanyForm({ company }: { company: ContractCompany }) {
  return (
    <Card
      title="اطلاعات مجری"
      description="مشخصاتی که در بخش طرفین و محل امضای همه قراردادها چاپ می‌شود. هر فیلدی که خالی بماند، در قرارداد به‌صورت جای خالی (……) برای تکمیل دستی چاپ می‌شود."
    >
      <form action={saveContractCompany} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="نام شرکت یا مجری" name="name" defaultValue={company.name} hint="نام حقوقی، همان‌طور که در قرارداد می‌آید." />
          <Field label="تلفن" name="phone" defaultValue={company.phone} dir="ltr" />
          <Field label="نام صاحب امضا" name="signatory" defaultValue={company.signatory} />
          <Field label="سمت صاحب امضا" name="signatoryTitle" defaultValue={company.signatoryTitle} placeholder="مثلاً مدیرعامل" />
          <Field label="شناسه ملی (اختیاری)" name="nationalId" defaultValue={company.nationalId} dir="ltr" />
          <Field label="شماره ثبت (اختیاری)" name="registrationNo" defaultValue={company.registrationNo} dir="ltr" />
        </div>
        <Field label="نشانی" name="address" defaultValue={company.address} multiline rows={2} />
        <div>
          <SubmitButton />
        </div>
      </form>
    </Card>
  );
}
