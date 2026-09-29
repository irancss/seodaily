import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/atoms";
import { Breadcrumb } from "@/components/molecules";
import { BlockRenderer, hasContent, type HrefMap } from "@/components/organisms/blocks/block-renderer";
import { outline } from "@/modules/blocks/text";
import { faDate, faNumber, formatBytes } from "@/modules/plugins/labels";
import type { PublicBlock, PublicPlugin } from "@/modules/plugins/queries";

import { PluginGrid } from "./plugin-card";
import { PluginIcon } from "./plugin-icon";

function GlobalBlocks({ blocks, hrefs }: { blocks: PublicBlock[]; hrefs: HrefMap }) {
  if (blocks.length === 0) return null;
  return (
    <>
      {blocks.map((b) => (
        <section key={b.id} aria-label={b.title || undefined} className="mt-10">
          {b.title && <h2 className="t-h3 mb-4">{b.title}</h2>}
          <BlockRenderer document={b.content} hrefs={hrefs} anchorPrefix={`b${b.id}-`} />
        </section>
      ))}
    </>
  );
}

function Fact({ label, children, ltr = false }: { label: string; children: ReactNode; ltr?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-medium text-ink" dir={ltr ? "ltr" : undefined}>
        {children}
      </dd>
    </div>
  );
}

/**
 * The public plugin page. The admin preview renders the same view with the
 * draft, so what the admin checks is what visitors will get.
 */
export function PluginPageView({ plugin, hrefs, download }: { plugin: PublicPlugin; hrefs: HrefMap; download: ReactNode }) {
  const current = plugin.releases.find((r) => r.current) ?? plugin.releases[0];
  const toc = outline(plugin.content).filter((o) => o.level === 2);
  const byPosition = (position: string) => plugin.blocks.filter((b) => b.position === position);
  const title = plugin.seoH1 || plugin.name;
  const breadcrumb = [
    { label: "خانه", href: "/" },
    { label: "افزونه‌های وردپرس", href: "/plugins" },
    ...(plugin.primaryCategory ? [{ label: plugin.primaryCategory.title, href: `/plugins/${plugin.primaryCategory.slug}` }] : []),
    { label: plugin.name },
  ];

  return (
    <>
      <section className="border-b border-line bg-page pt-8 pb-10 lg:pt-12 lg:pb-14">
        <div className="container-site">
          <Breadcrumb items={breadcrumb} />
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
            <PluginIcon src={plugin.iconUrl} name={plugin.name} size={88} priority />
            <div className="min-w-0">
              <h1 className="t-h1 text-[1.75rem] leading-[1.6] lg:text-[2.25rem]">{title}</h1>
              {plugin.originalName && plugin.originalName !== plugin.name && (
                <p className="mt-1 text-base text-muted" dir="ltr" lang="en">
                  {plugin.originalName}
                </p>
              )}
              {plugin.excerpt && <p className="body-lg mt-3 max-w-[760px]">{plugin.excerpt}</p>}
              <ul className="mt-5 flex flex-wrap gap-2 text-sm">
                {current && (
                  <li className="chip bg-white">
                    نسخه <span dir="ltr">{current.version}</span>
                  </li>
                )}
                {plugin.packageUpdatedAt && (
                  <li className="chip bg-white">
                    به‌روزرسانی <time dateTime={plugin.packageUpdatedAt}>{faDate(plugin.packageUpdatedAt)}</time>
                  </li>
                )}
                {plugin.downloads > 0 && <li className="chip bg-white">{faNumber(plugin.downloads)} دانلود</li>}
                {plugin.categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/plugins/${c.slug}`} className="chip bg-white no-underline hover:border-brand">
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
              {current && (
                <a href="#download" className="btn btn-primary mt-6 h-12 gap-2 px-6">
                  <Icon name="download" size={18} />
                  دانلود افزونه
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-site grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 lg:py-14">
        <div className="min-w-0">
          {plugin.discontinued && (
            <p role="note" className="mb-8 rounded-lg border border-warning/30 bg-warning-bg p-4 text-sm leading-[1.9] text-warning">
              <strong>پشتیبانی این افزونه متوقف شده است.</strong> {plugin.discontinuedNote}
            </p>
          )}

          {toc.length >= 3 && (
            <nav aria-label="فهرست مطالب" className="mb-8 rounded-lg border border-line bg-white p-5">
              <p className="font-semibold">فهرست مطالب</p>
              <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm leading-[1.9]">
                {toc.map((o) => (
                  <li key={o.anchor}>
                    <a href={`#${o.anchor}`}>{o.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {hasContent(plugin.content) && <BlockRenderer document={plugin.content} hrefs={hrefs} priorityImages={1} />}

          {plugin.gallery.length > 0 && (
            <section aria-labelledby="gallery-title" className="mt-10">
              <h2 id="gallery-title" className="t-h3 mb-4">
                تصاویر
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {plugin.gallery.map((g) => (
                  <li key={g.url}>
                    <figure className="overflow-hidden rounded-lg border border-line bg-white">
                      <Image
                        src={g.url}
                        alt={g.alt}
                        width={g.width ?? 1200}
                        height={g.height ?? 750}
                        sizes="(min-width: 1024px) 400px, 100vw"
                        className="h-auto w-full"
                      />
                      {g.alt && <figcaption className="px-3 py-2 text-xs leading-[1.8] text-muted">{g.alt}</figcaption>}
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <GlobalBlocks blocks={byPosition("before_download")} hrefs={hrefs} />

          <section id="download" aria-labelledby="download-title" className="mt-10 scroll-mt-24">
            <h2 id="download-title" className="t-h2 text-2xl">
              دانلود {plugin.name}
            </h2>
            {download}
          </section>

          <GlobalBlocks blocks={byPosition("after_download")} hrefs={hrefs} />
        </div>

        <aside aria-label="مشخصات افزونه" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="font-semibold">مشخصات</h2>
            <dl className="mt-2 text-sm">
              {current && (
                <Fact label="نسخه" ltr>
                  {current.version}
                </Fact>
              )}
              {plugin.packageUpdatedAt && <Fact label="به‌روزرسانی فایل">{faDate(plugin.packageUpdatedAt)}</Fact>}
              {current && formatBytes(current.bytes) && <Fact label="حجم">{formatBytes(current.bytes)}</Fact>}
              {plugin.requiresWp && (
                <Fact label="حداقل وردپرس" ltr>
                  {plugin.requiresWp}
                </Fact>
              )}
              {plugin.requiresPhp && (
                <Fact label="حداقل PHP" ltr>
                  {plugin.requiresPhp}
                </Fact>
              )}
              {plugin.testedUpTo && (
                <Fact label="آزمایش‌شده تا وردپرس" ltr>
                  {plugin.testedUpTo}
                </Fact>
              )}
              {plugin.license && (
                <Fact label="مجوز" ltr>
                  {plugin.license}
                </Fact>
              )}
              {plugin.authorName && (
                <Fact label="سازنده">
                  {plugin.authorUrl ? (
                    <a href={plugin.authorUrl} target="_blank" rel="noopener noreferrer nofollow">
                      {plugin.authorName}
                    </a>
                  ) : (
                    plugin.authorName
                  )}
                </Fact>
              )}
              {plugin.downloads > 0 && <Fact label="دانلود">{faNumber(plugin.downloads)}</Fact>}
              {plugin.lastCheckedAt && <Fact label="آخرین بررسی منابع">{faDate(plugin.lastCheckedAt)}</Fact>}
            </dl>
            {current && (
              <div className="mt-3 text-xs leading-[1.8]">
                <p className="text-muted">SHA-256 فایل نسخه جاری:</p>
                <code dir="ltr" className="mt-1 block break-all rounded bg-page px-2 py-1 font-mono text-[11px] text-ink-2">
                  {current.sha256}
                </code>
              </div>
            )}
            {plugin.officialUrl && (
              <a href={plugin.officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1 text-sm">
                صفحه رسمی افزونه
                <Icon name="external" size={14} />
              </a>
            )}
            {current && (
              <a href="#download" className="btn btn-primary mt-5 h-11 w-full gap-2">
                <Icon name="download" size={18} />
                دانلود نسخه <span dir="ltr">{current.version}</span>
              </a>
            )}
            <p className="mt-4 text-xs leading-[1.9] text-muted">
              ما فقط میزبان این فایل هستیم؛ افزونه متعلق به سازنده آن است و فایل اصلی بدون تغییر ارائه می‌شود.
            </p>
          </div>
        </aside>
      </div>

      {(plugin.related.length > 0 || byPosition("page_end").length > 0) && (
        <div className="border-t border-line bg-page py-12 lg:py-16">
          <div className="container-site">
            {plugin.related.length > 0 && (
              <section aria-labelledby="related-title">
                <h2 id="related-title" className="t-h2 text-2xl">
                  افزونه‌های مرتبط
                </h2>
                <PluginGrid plugins={plugin.related} className="mt-6" />
              </section>
            )}
            <GlobalBlocks blocks={byPosition("page_end")} hrefs={hrefs} />
          </div>
        </div>
      )}
    </>
  );
}
