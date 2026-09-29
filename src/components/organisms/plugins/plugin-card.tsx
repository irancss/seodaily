import Link from "next/link";
import type { CSSProperties } from "react";

import { Icon } from "@/components/atoms";
import { cx } from "@/lib/utils";
import { faDate, faNumber } from "@/modules/plugins/labels";
import type { PluginCard as PluginCardData } from "@/modules/plugins/queries";

import { PluginIcon } from "./plugin-icon";

/** Library teaser: icon, name, primary category, summary, current version and last file update. */
export function PluginCard({ plugin, className, style }: { plugin: PluginCardData; className?: string; style?: CSSProperties }) {
  return (
    <article
      className={cx(
        "group relative flex flex-col gap-4 rounded-xl border border-line bg-white p-5 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      style={style}
    >
      <div className="flex items-start gap-4">
        <PluginIcon src={plugin.iconUrl} name={plugin.name} size={56} />
        <div className="min-w-0">
          <h3 className="t-h3 text-lg leading-[1.7]">
            <Link href={`/plugins/${plugin.slug}`} className="text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:text-brand">
              {plugin.name}
            </Link>
          </h3>
          {plugin.category && <p className="text-sm leading-[1.7] text-muted">{plugin.category.title}</p>}
        </div>
      </div>
      {plugin.excerpt && <p className="line-clamp-2 text-sm leading-[1.9] text-ink-2">{plugin.excerpt}</p>}
      <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs leading-[1.8] text-muted">
        {plugin.version && (
          <div className="flex gap-1">
            <dt>نسخه</dt>
            <dd dir="ltr" className="font-medium text-ink-2">
              {plugin.version}
            </dd>
          </div>
        )}
        {plugin.updatedAt && (
          <div className="flex gap-1">
            <dt>به‌روزرسانی</dt>
            <dd className="font-medium text-ink-2">
              <time dateTime={plugin.updatedAt}>{faDate(plugin.updatedAt)}</time>
            </dd>
          </div>
        )}
        {plugin.downloads > 0 && (
          <div className="flex items-center gap-1">
            <dt>
              <Icon name="download" size={14} />
              <span className="sr-only">دانلود</span>
            </dt>
            <dd className="font-medium text-ink-2">{faNumber(plugin.downloads)}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

export function PluginGrid({ plugins, className }: { plugins: PluginCardData[]; className?: string }) {
  return (
    <ul className={cx("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {plugins.map((p) => (
        <li key={p.id} className="flex">
          <PluginCard plugin={p} className="w-full" />
        </li>
      ))}
    </ul>
  );
}
