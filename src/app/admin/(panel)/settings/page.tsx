import { PageHeader } from "@/components/molecules";
import { ContactSettingsForm, GeneralSettingsForm } from "@/components/organisms/admin";
import { getContact, getGeneral } from "@/modules/settings/queries";

export const metadata = { title: "تنظیمات سایت" };

export default async function SettingsAdmin() {
  const [general, contact] = await Promise.all([getGeneral(), getContact()]);
  return (
    <>
      <PageHeader title="تنظیمات سایت" />
      <div className="flex flex-col gap-6">
        <ContactSettingsForm contact={contact} />
        <GeneralSettingsForm general={general} />
      </div>
    </>
  );
}
