"use server";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { bool, failed, int, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { deleteImage, saveImage, UploadError } from "@/modules/uploads/storage";

export async function saveMember(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const name = str(form, "name", 120);
  if (!name) failed("/admin/team", "نام را وارد کنید.");
  const existing = id ? await db.query.teamMembers.findFirst({ where: eq(schema.teamMembers.id, id) }) : undefined;

  let photoUrl = existing?.photoUrl ?? "";
  try {
    const uploaded = await saveImage(form.get("photo"));
    if (uploaded || bool(form, "photo_remove")) {
      await deleteImage(photoUrl);
      photoUrl = uploaded ?? "";
    }
  } catch (error) {
    if (error instanceof UploadError) failed("/admin/team", error.message);
    throw error;
  }

  const values = {
    name,
    role: str(form, "role", 120),
    bio: str(form, "bio", 600),
    photoUrl,
    sortOrder: int(form, "sortOrder"),
    published: bool(form, "published"),
  };
  if (id) await db.update(schema.teamMembers).set(values).where(eq(schema.teamMembers.id, id));
  else await db.insert(schema.teamMembers).values(values);
  saved("/admin/team");
}

export async function deleteMember(form: FormData) {
  await requireAdmin();
  const [row] = await db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, int(form, "id"))).returning();
  if (row) await deleteImage(row.photoUrl);
  saved("/admin/team", "عضو تیم حذف شد.");
}
