"use server";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { bool, failed, int, isSlug, isUniqueViolation, lines, rows, saved, str, toSlug } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { deleteImage, saveImage, UploadError } from "@/modules/uploads/storage";

export async function saveService(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = id ? `/admin/services/${id}` : "/admin/services/new";

  const title = str(form, "title", 200);
  const category = str(form, "category");
  const slug = toSlug(str(form, "slug", 200) || title);
  if (!title) failed(back, "عنوان خدمت را وارد کنید.");
  if (!isSlug(slug)) failed(back, "نامک (آدرس) معتبر نیست.");
  const cat = await db.query.categories.findFirst({ where: eq(schema.categories.slug, category) });
  if (!cat) failed(back, "دسته خدمت نامعتبر است.");

  const existing = id ? await db.query.services.findFirst({ where: eq(schema.services.id, id) }) : undefined;
  if (id && !existing) failed("/admin/services", "خدمت پیدا نشد.");

  let imageUrl = existing?.imageUrl ?? "";
  try {
    const uploaded = await saveImage(form.get("image"));
    if (uploaded || bool(form, "image_remove")) {
      await deleteImage(imageUrl);
      imageUrl = uploaded ?? "";
    }
  } catch (error) {
    if (error instanceof UploadError) failed(back, error.message);
    throw error;
  }

  const values = {
    slug,
    category,
    title,
    englishTitle: str(form, "englishTitle", 200),
    icon: str(form, "icon", 40) || "layers",
    summary: str(form, "summary", 600),
    heroDescription: str(form, "heroDescription", 1500),
    overview: str(form, "overview", 5000),
    sections: rows(form, "sections", ["title", "body"] as const).slice(0, 8),
    imageUrl,
    problemIntro: str(form, "problemIntro", 2000),
    problems: lines(form, "problems"),
    includesIntro: str(form, "includesIntro", 600),
    includes: rows(form, "includes", ["title", "description"] as const),
    process: rows(form, "process", ["title", "description"] as const).slice(0, 6),
    forWhoIntro: str(form, "forWhoIntro", 2000),
    situations: lines(form, "situations"),
    businessTypes: lines(form, "businessTypes"),
    deliverablesIntro: str(form, "deliverablesIntro", 600),
    deliverables: rows(form, "deliverables", ["title", "description"] as const),
    faqs: rows(form, "faqs", ["question", "answer"] as const),
    relatedSlugs: form.getAll("relatedSlugs").map(String).filter((s) => s !== slug),
    metaTitle: str(form, "metaTitle", 200),
    metaDescription: str(form, "metaDescription", 400),
    published: bool(form, "published"),
    sortOrder: int(form, "sortOrder"),
    updatedAt: new Date(),
  };

  let savedId = id;
  try {
    if (id) {
      await db.update(schema.services).set(values).where(eq(schema.services.id, id));
    } else {
      const [row] = await db.insert(schema.services).values(values).returning({ id: schema.services.id });
      savedId = row.id;
    }
  } catch (error) {
    if (isUniqueViolation(error)) failed(back, "خدمت دیگری با همین نامک وجود دارد.");
    throw error;
  }
  saved(`/admin/services/${savedId}`);
}

export async function deleteService(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const [row] = await db.delete(schema.services).where(eq(schema.services.id, id)).returning();
  if (row) await deleteImage(row.imageUrl);
  saved("/admin/services", "خدمت حذف شد.");
}

export async function saveCategory(form: FormData) {
  await requireAdmin();
  const slug = str(form, "slug");
  const title = str(form, "title", 120);
  if (!title) failed("/admin/services", "عنوان خدمت اصلی را وارد کنید.");
  await db
    .update(schema.categories)
    .set({ title, description: str(form, "description", 1000) })
    .where(eq(schema.categories.slug, slug));
  saved("/admin/services");
}
