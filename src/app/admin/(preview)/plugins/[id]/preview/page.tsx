import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DownloadBox } from "@/components/organisms/plugins/download-box";
import { PluginPageView } from "@/components/organisms/plugins/plugin-page-view";
import { requireAdmin } from "@/modules/auth/session";
import { validateBlockDocument } from "@/modules/blocks/validate";
import { PLUGIN_STATUS_LABEL } from "@/modules/plugins/labels";
import { entityHrefs, getPluginPreview } from "@/modules/plugins/queries";

export const metadata: Metadata = { title: "پیش‌نمایش افزونه", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

/**
 * The draft rendered through the public template, outside the admin shell.
 * Admin-only and never cached (it reads the session cookie).
 */
export default async function PluginPreview({ params }: Props) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const plugin = await getPluginPreview(id);
  if (!plugin) notFound();
  const content = validateBlockDocument(plugin.content).document;
  const view = { ...plugin, content };
  const hrefs = await entityHrefs([content, ...plugin.blocks.map((b) => b.content)]);

  return (
    <div className="bg-white">
      <div role="status" className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-inverse px-4 py-2.5 text-sm text-white">
        <span>
          پیش‌نمایش پیش‌نویس · وضعیت: {PLUGIN_STATUS_LABEL[plugin.status]} · این صفحه فقط برای مدیر دیده می‌شود.
        </span>
        <Link href={`/admin/plugins/${id}`} className="text-white underline">
          بازگشت به ویرایش
        </Link>
      </div>
      <main>
        <PluginPageView plugin={view} hrefs={hrefs} download={<DownloadBox releases={plugin.releases} preview />} />
      </main>
    </div>
  );
}
