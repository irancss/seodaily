import { PageHeader } from "@/components/molecules";
import { TeamMemberForm } from "@/components/organisms/admin";
import { listTeamMembers } from "@/modules/admin/team-queries";

export const metadata = { title: "تیم" };

export default async function TeamAdmin() {
  const members = await listTeamMembers();
  return (
    <>
      <PageHeader title="تیم" description="اعضای تیم در صفحه «درباره ما» نمایش داده می‌شوند. تا وقتی عضوی ثبت نشده، متن جایگزین نشان داده می‌شود." />
      <div className="flex flex-col gap-4">
        {members.map((m) => (
          <TeamMemberForm key={m.id} member={m} />
        ))}
        <TeamMemberForm />
      </div>
    </>
  );
}
