import Link from "next/link";

import { Icon } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { PluginsSubnav } from "@/components/organisms/admin/plugins/plugins-subnav";
import { listGlobalBlocks } from "@/modules/plugins/admin-queries";
import { BLOCK_POSITION_LABEL } from "@/modules/plugins/labels";

export const metadata = { title: "بلوک‌های سراسری افزونه" };

export default async function GlobalBlocksAdmin() {
  const blocks = await listGlobalBlocks();
  return (
    <>
      <PageHeader
        title="بلوک‌های سراسری"
        description="متن‌های مشترک صفحه افزونه‌ها (مثل راهنمای نصب یا یادآوری پشتیبان‌گیری) که یک‌جا ویرایش می‌شوند."
        action={
          <Link href="/admin/plugins/blocks/new" className="btn btn-primary h-11 px-5 text-sm">
            <Icon name="plus" size={18} />
            بلوک جدید
          </Link>
        }
      />
      <PluginsSubnav />
      {blocks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong bg-white p-8 text-center text-sm text-muted">هنوز بلوکی ساخته نشده است.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {blocks.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <Link href={`/admin/plugins/blocks/${b.id}`} className="font-medium text-ink no-underline hover:text-brand">
                {b.name}
              </Link>
              <span className="text-sm text-muted">
                {BLOCK_POSITION_LABEL[b.position]} · {b.appliesToAll ? "همه افزونه‌ها" : `${b.includeIds.length.toLocaleString("fa-IR")} افزونه`}
                {b.excludeIds.length > 0 && ` · به‌جز ${b.excludeIds.length.toLocaleString("fa-IR")}`}
                {!b.enabled && " · غیرفعال"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
