"use server";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { bool, failed, int, isSlug, isUniqueViolation, saved, str, toSlug } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { deleteImage, saveImage, UploadError } from "@/lib/uploads";

export async function saveProject(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const back = id ? `/admin/projects/${id}` : "/admin/projects/new";

  const title = str(form, "title", 200);
  const slug = toSlug(str(form, "slug", 200) || title);
  if (!title) failed(back, "نام پروژه را وارد کنید.");
  if (!isSlug(slug)) failed(back, "نامک (آدرس) معتبر نیست.");

  let websiteUrl = str(form, "websiteUrl", 300);
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) websiteUrl = `https://${websiteUrl}`;
  if (websiteUrl && !URL.canParse(websiteUrl)) failed(back, "آدرس سایت پروژه معتبر نیست.");

  const existing = id ? await db.query.projects.findFirst({ where: eq(schema.projects.id, id) }) : undefined;
  if (id && !existing) failed("/admin/projects", "پروژه پیدا نشد.");

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

  const isCaseStudy = bool(form, "isCaseStudy");
  const values = {
    slug,
    title,
    projectType: str(form, "projectType", 80),
    category: str(form, "category", 40),
    summary: str(form, "summary", 400),
    description: str(form, "description", 10000),
    imageUrl,
    websiteUrl,
    problem: str(form, "problem", 3000),
    solution: str(form, "solution", 3000),
    result: str(form, "result", 3000),
    featured: bool(form, "featured"),
    isCaseStudy,
    published: bool(form, "published"),
    sortOrder: int(form, "sortOrder"),
    updatedAt: new Date(),
  };

  let savedId = id;
  try {
    await db.transaction(async (tx) => {
      // Only one project is shown as the case study on the portfolio page.
      if (isCaseStudy) await tx.update(schema.projects).set({ isCaseStudy: false });
      if (id) {
        await tx.update(schema.projects).set(values).where(eq(schema.projects.id, id));
      } else {
        const [row] = await tx.insert(schema.projects).values(values).returning({ id: schema.projects.id });
        savedId = row.id;
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) failed(back, "پروژه دیگری با همین نامک وجود دارد.");
    throw error;
  }
  saved(`/admin/projects/${savedId}`);
}

export async function deleteProject(form: FormData) {
  await requireAdmin();
  const [row] = await db.delete(schema.projects).where(eq(schema.projects.id, int(form, "id"))).returning();
  if (row) await deleteImage(row.imageUrl);
  saved("/admin/projects", "پروژه حذف شد.");
}
