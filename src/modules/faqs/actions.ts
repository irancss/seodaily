"use server";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { FAQ_PAGES, type FaqPage } from "@/db/schema";
import { failed, int, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";

function pageOf(form: FormData): FaqPage {
  const page = str(form, "page") as FaqPage;
  return FAQ_PAGES.includes(page) ? page : "home";
}

export async function saveFaq(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  const page = pageOf(form);
  const back = `/admin/faqs?page=${page}`;
  const question = str(form, "question", 400);
  const answer = str(form, "answer", 3000);
  if (!question || !answer) failed(back, "سؤال و پاسخ هر دو لازم هستند.");
  const values = { page, question, answer, sortOrder: int(form, "sortOrder") };
  if (id) {
    const updated = await db.update(schema.faqs).set(values).where(eq(schema.faqs.id, id)).returning({ id: schema.faqs.id });
    // Deleted meanwhile (another tab): say so instead of reporting a save.
    if (updated.length === 0) failed(back, "این سؤال دیگر وجود ندارد (احتمالاً حذف شده است).");
  } else {
    await db.insert(schema.faqs).values(values);
  }
  saved(back);
}

export async function deleteFaq(form: FormData) {
  await requireAdmin();
  await db.delete(schema.faqs).where(eq(schema.faqs.id, int(form, "id")));
  saved(`/admin/faqs?page=${pageOf(form)}`, "سؤال حذف شد.");
}
