import { asc } from "drizzle-orm";

import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { Card, Checkbox, Field, Flash, ImageField, PageHeader } from "@/components/admin/ui";
import { db, schema } from "@/db";
import type { TeamMember } from "@/db/schema";

import { deleteMember, saveMember } from "./actions";

export const metadata = { title: "تیم" };

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

export default async function TeamAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const members = await db.select().from(schema.teamMembers).orderBy(asc(schema.teamMembers.sortOrder), asc(schema.teamMembers.id));
  return (
    <>
      <PageHeader title="تیم" description="اعضای تیم در صفحه «درباره ما» نمایش داده می‌شوند. تا وقتی عضوی ثبت نشده، متن جایگزین نشان داده می‌شود." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex flex-col gap-4">
        {members.map((m) => (
          <Card key={m.id} title={m.name}>
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
        ))}
        <Card title="عضو جدید">
          <form action={saveMember} className="grid gap-4">
            <MemberFields />
            <div><SubmitButton>افزودن</SubmitButton></div>
          </form>
        </Card>
      </div>
    </>
  );
}
