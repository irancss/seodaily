import { Checkbox, ConfirmButton, SubmitButton } from "@/components/atoms";
import { Card, Field, ImageField } from "@/components/molecules";
import type { TeamMember } from "@/db/schema";
import { deleteMember, saveMember } from "@/modules/team/actions";

function MemberFields({ m }: { m?: TeamMember }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="نام" name="name" defaultValue={m?.name} required />
        <Field label="نقش" name="role" defaultValue={m?.role} />
        <Field label="ترتیب" name="sortOrder" type="number" defaultValue={m?.sortOrder ?? 0} />
      </div>
      <Field label="معرفی کوتاه" name="bio" defaultValue={m?.bio} multiline rows={2} />
      <ImageField label="عکس" name="photo" current={m?.photoUrl || undefined} hint="تصویر مربعی، حداکثر ۵ مگابایت." />
      <Checkbox label="نمایش در سایت" name="published" defaultChecked={m?.published ?? true} />
    </>
  );
}

/** Edit (with delete) card for a team member, or the "new member" card when `member` is omitted. */
export function TeamMemberForm({ member: m }: { member?: TeamMember }) {
  if (!m) {
    return (
      <Card title="عضو جدید">
        <form action={saveMember} className="grid gap-4">
          <MemberFields />
          <div><SubmitButton>افزودن</SubmitButton></div>
        </form>
      </Card>
    );
  }
  return (
    <Card title={m.name}>
      <form action={saveMember} className="grid gap-4">
        <input type="hidden" name="id" value={m.id} />
        <MemberFields m={m} />
        <div><SubmitButton /></div>
      </form>
      <form action={deleteMember} className="mt-3">
        <input type="hidden" name="id" value={m.id} />
        <ConfirmButton message="این عضو حذف شود؟" />
      </form>
    </Card>
  );
}
