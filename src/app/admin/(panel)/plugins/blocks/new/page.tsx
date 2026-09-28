import { PageHeader } from "@/components/molecules";
import { GlobalBlockForm } from "@/components/organisms/admin/plugins/global-block-form";
import { pluginOptions } from "@/modules/plugins/admin-queries";

export const metadata = { title: "بلوک سراسری جدید" };

export default async function NewGlobalBlock() {
  const options = await pluginOptions();
  return (
    <>
      <PageHeader title="بلوک سراسری جدید" back={{ href: "/admin/plugins/blocks", label: "بلوک‌های سراسری" }} />
      <GlobalBlockForm
        block={{ id: null, name: "", title: "", content: null, position: "page_end", sortOrder: 0, enabled: true, appliesToAll: true, includeIds: [], excludeIds: [] }}
        options={options}
      />
    </>
  );
}
