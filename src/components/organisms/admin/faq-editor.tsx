import { ConfirmButton, SubmitButton } from "@/components/atoms";
import { Card, Field } from "@/components/molecules";
import type { Faq, FaqPage } from "@/db/schema";
import { deleteFaq, saveFaq } from "@/modules/faqs/actions";

import { FAQ_PAGE_LABELS } from "./faq-page-tabs";

/** Edit (with delete) card for an existing FAQ, or the "new question" card when `faq` is omitted. */
export function FaqEditor({ page, faq: f, nextOrder }: { page: FaqPage; faq?: Faq; nextOrder?: number }) {
  if (!f) {
    return (
      <Card title={`سؤال جدید — ${FAQ_PAGE_LABELS[page]}`}>
        <form action={saveFaq} className="grid gap-4">
          <input type="hidden" name="page" value={page} />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
            <Field label="سؤال" name="question" required />
            <Field label="ترتیب" name="sortOrder" type="number" defaultValue={nextOrder} />
          </div>
          <Field label="پاسخ" name="answer" multiline rows={3} required />
          <div><SubmitButton>افزودن سؤال</SubmitButton></div>
        </form>
      </Card>
    );
  }
  return (
    <Card>
      <form action={saveFaq} className="grid gap-4">
        <input type="hidden" name="id" value={f.id} />
        <input type="hidden" name="page" value={page} />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Field label="سؤال" name="question" defaultValue={f.question} required />
          <Field label="ترتیب" name="sortOrder" type="number" defaultValue={f.sortOrder} />
        </div>
        <Field label="پاسخ" name="answer" defaultValue={f.answer} multiline rows={3} required />
        <div><SubmitButton /></div>
      </form>
      <form action={deleteFaq} className="mt-3">
        <input type="hidden" name="id" value={f.id} />
        <input type="hidden" name="page" value={page} />
        <ConfirmButton message="این سؤال حذف شود؟" />
      </form>
    </Card>
  );
}
