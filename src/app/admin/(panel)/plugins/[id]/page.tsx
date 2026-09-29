import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmButton, SubmitButton } from "@/components/atoms";
import { Card, PageHeader } from "@/components/molecules";
import { PluginForm } from "@/components/organisms/admin/plugins/plugin-form";
import { PluginsSubnav } from "@/components/organisms/admin/plugins/plugins-subnav";
import type { BlockDocument } from "@/modules/blocks/schema";
import { archivePluginAction, deletePluginAction, publishPluginAction, restorePluginAction, setBaseCountAction } from "@/modules/plugins/actions";
import { getPluginAdmin, listCategoriesAdmin, pluginOptions } from "@/modules/plugins/admin-queries";
import { publishBlockers } from "@/modules/plugins/catalog";
import { META_FIELDS, PLUGIN_STATUS_LABEL, publicDownloadCount, type MetaField } from "@/modules/plugins/labels";

export const metadata = { title: "ویرایش افزونه" };

type Props = { params: Promise<{ id: string }> };

const dateFa = (d: Date | string | null) =>
  d ? new Date(d).toLocaleString("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" }) : "—";

export default async function EditPlugin({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [data, categories, options] = await Promise.all([getPluginAdmin(id), listCategoriesAdmin(), pluginOptions(id)]);
  if (!data) notFound();
  const { plugin, categoryIds, sources, releases } = data;
  const blockers = await publishBlockers(id);
  const draftDiffers = JSON.stringify(plugin.contentDraft) !== JSON.stringify(plugin.contentPublished);
  const current = releases.find((r) => r.id === plugin.currentReleaseId);
  const reviewing = releases.filter((r) => r.state === "review").length;
  const meta = Object.fromEntries(META_FIELDS.map((f) => [f, String(plugin[f] ?? "")])) as Record<MetaField, string>;

  return (
    <>
      <PageHeader
        title={plugin.name}
        back={{ href: "/admin/plugins", label: "افزونه‌ها" }}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/plugins/${id}/preview`} target="_blank" className="btn btn-secondary h-11 px-4 text-sm">
              پیش‌نمایش پیش‌نویس
            </Link>
            {plugin.status === "published" && (
              <Link href={`/plugins/${plugin.slug}`} target="_blank" className="btn btn-secondary h-11 px-4 text-sm">
                مشاهده صفحه
              </Link>
            )}
          </div>
        }
      />
      <PluginsSubnav />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card title="وضعیت انتشار" className="lg:col-span-2">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-muted">صفحه:</dt>
              <dd className="font-semibold">{PLUGIN_STATUS_LABEL[plugin.status]}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">نسخه جاری فایل:</dt>
              <dd dir="ltr">{current ? current.sourceVersion : "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">انتشار صفحه:</dt>
              <dd>{dateFa(plugin.publishedAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">آخرین تغییر متن منتشرشده:</dt>
              <dd>{dateFa(plugin.contentUpdatedAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">به‌روزرسانی فایل:</dt>
              <dd>{dateFa(plugin.packageUpdatedAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">آخرین بررسی منابع:</dt>
              <dd>{dateFa(plugin.lastCheckedAt)}</dd>
            </div>
          </dl>
          {draftDiffers && plugin.status === "published" && <p className="mt-4 rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">پیش‌نویس تغییراتی دارد که هنوز منتشر نشده است.</p>}
          {plugin.status !== "published" && blockers.length > 0 && (
            <div className="mt-4 rounded-md bg-page p-3 text-sm">
              <p className="font-semibold">پیش از انتشار:</p>
              <ul className="mt-1 list-disc ps-5 text-ink-2">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {plugin.status !== "archived" && (blockers.length === 0 || plugin.status === "published") && (
              <form action={publishPluginAction} method="post">
                <input type="hidden" name="id" value={id} />
                <SubmitButton>{plugin.status === "published" ? "انتشار تغییرات پیش‌نویس" : "انتشار در سایت"}</SubmitButton>
              </form>
            )}
            {plugin.status === "published" && (
              <form action={archivePluginAction} method="post">
                <input type="hidden" name="id" value={id} />
                <ConfirmButton message="افزونه از سایت برداشته شود؟ صفحه و دانلود آن در دسترس نخواهد بود.">بایگانی</ConfirmButton>
              </form>
            )}
            {plugin.status === "archived" && (
              <form action={restorePluginAction} method="post">
                <input type="hidden" name="id" value={id} />
                <SubmitButton variant="secondary">بازگرداندن به پیش‌نویس</SubmitButton>
              </form>
            )}
            {plugin.status !== "published" && (
              <form action={deletePluginAction} method="post">
                <input type="hidden" name="id" value={id} />
                <ConfirmButton message="افزونه، منابع و نسخه‌های آن حذف شوند؟ آمار دانلود گذشته حفظ می‌شود.">حذف افزونه</ConfirmButton>
              </form>
            )}
          </div>
        </Card>
        <Card title="منابع و نسخه‌ها">
          <p className="text-sm leading-[1.9] text-ink-2">
            {sources.length.toLocaleString("fa-IR")} منبع · {releases.filter((r) => r.downloadable).length.toLocaleString("fa-IR")} نسخه آماده دانلود
            {reviewing > 0 && <span className="block text-warning">{reviewing.toLocaleString("fa-IR")} نسخه منتظر بررسی شما</span>}
          </p>
          <Link href={`/admin/plugins/${id}/sources`} className="btn btn-secondary mt-4 h-10 px-4 text-sm">
            مدیریت منابع، نسخه‌ها و بررسی
          </Link>
        </Card>
      </div>

      <PluginForm
        plugin={{
          id,
          revision: plugin.revision,
          name: plugin.name,
          slug: plugin.slug,
          excerpt: plugin.excerpt,
          contentDraft: plugin.contentDraft as BlockDocument | null,
          primaryCategoryId: plugin.primaryCategoryId,
          iconUrl: plugin.iconUrl,
          iconSource: plugin.iconSource,
          gallery: plugin.gallery,
          meta,
          manualFields: plugin.manualFields,
          provenance: plugin.provenance,
          seoTitle: plugin.seoTitle,
          seoDescription: plugin.seoDescription,
          seoH1: plugin.seoH1,
          canonicalUrl: plugin.canonicalUrl,
          noindex: plugin.noindex,
          ogImage: plugin.ogImage,
          autoUpdate: plugin.autoUpdate,
          allowPrerelease: plugin.allowPrerelease,
          discontinued: plugin.discontinued,
          discontinuedNote: plugin.discontinuedNote,
          relatedIds: plugin.relatedIds,
          categoryIds,
        }}
        categories={categories.map((c) => ({ id: c.id, title: c.title }))}
        options={options}
      />

      <div id="stats" className="mt-6 scroll-mt-24">
        <Card title="شمارش دانلود" description="عدد عمومی = عدد پایه (آمار قبلی که شما وارد می‌کنید) + دانلودهای کامل ثبت‌شده. در آمار و گزارش‌ها فقط دانلود ثبت‌شده به کار می‌رود.">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-page p-3">
              <dt className="text-muted">دانلود ثبت‌شده</dt>
              <dd className="text-lg font-bold">{plugin.measuredDownloadCount.toLocaleString("fa-IR")}</dd>
            </div>
            <div className="rounded-lg bg-page p-3">
              <dt className="text-muted">عدد پایه</dt>
              <dd className="text-lg font-bold">{plugin.baseDownloadCount.toLocaleString("fa-IR")}</dd>
            </div>
            <div className="rounded-lg bg-page p-3">
              <dt className="text-muted">نمایش عمومی</dt>
              <dd className="text-lg font-bold">{publicDownloadCount(plugin).toLocaleString("fa-IR")}</dd>
            </div>
          </dl>
          <form action={setBaseCountAction} method="post" className="mt-5 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-end">
            <input type="hidden" name="id" value={id} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">عدد پایه جدید</span>
              <input name="baseDownloadCount" inputMode="numeric" dir="ltr" defaultValue={plugin.baseDownloadCount} className="field h-10" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">دلیل (ثبت در گزارش تغییرات)</span>
              <input name="reason" required maxLength={300} className="field h-10" placeholder="مثلاً: آمار سایت قبلی تا ۱۴۰۵/۰۶/۳۱" />
            </label>
            <SubmitButton variant="secondary">ثبت</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
