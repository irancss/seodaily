import { Flash, PageHeader } from "@/components/molecules";
import { ContactSettingsForm, GeneralSettingsForm } from "@/components/organisms/admin";
import { getContact, getGeneral } from "@/modules/settings/queries";

export const metadata = { title: "تنظیمات سایت" };

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [sp, general, contact] = await Promise.all([searchParams, getGeneral(), getContact()]);
  return (
    <>
      <PageHeader title="تنظیمات سایت" />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex flex-col gap-6">
        <ContactSettingsForm contact={contact} />
        <GeneralSettingsForm general={general} />
      </div>
    </>
  );
}
