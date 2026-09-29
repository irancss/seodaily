import { notFound } from "next/navigation";

import { ConfirmButton } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { GlobalBlockForm } from "@/components/organisms/admin/plugins/global-block-form";
import type { BlockDocument } from "@/modules/blocks/schema";
import { deleteGlobalBlockAction } from "@/modules/plugins/actions";
import { getGlobalBlock, pluginOptions } from "@/modules/plugins/admin-queries";

export const metadata = { title: "ویرایش بلوک سراسری" };

export default async function EditGlobalBlock({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [block, options] = await Promise.all([getGlobalBlock(id), pluginOptions()]);
  if (!block) notFound();
  return (
    <>
      <PageHeader title={block.name} back={{ href: "/admin/plugins/blocks", label: "بلوک‌های سراسری" }} />
      <GlobalBlockForm block={{ ...block, content: block.content as BlockDocument | null }} options={options} />
      <form action={deleteGlobalBlockAction} method="post" className="mt-6">
        <input type="hidden" name="id" value={id} />
        <ConfirmButton message="این بلوک از همه صفحات حذف شود؟">حذف بلوک</ConfirmButton>
      </form>
    </>
  );
}
