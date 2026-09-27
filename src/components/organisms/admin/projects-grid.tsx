import Link from "next/link";

import { Badge, EmptyState } from "@/components/atoms";
import type { Project } from "@/db/schema";
import { projectHref } from "@/modules/projects/routes";

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return <EmptyState>هنوز پروژه‌ای ثبت نشده است. تا وقتی پروژه‌ای نباشد، بخش نمونه‌کارهای صفحه اصلی نمایش داده نمی‌شود.</EmptyState>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <li key={p.id} className="overflow-hidden rounded-xl border border-line bg-white">
          <Link href={`/admin/projects/${p.id}`} className="block text-ink no-underline hover:text-brand">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover object-top" />
            ) : (
              <div className="grid-bg flex aspect-[16/10] items-center justify-center bg-soft text-sm text-muted" style={{ ["--grid" as string]: "24px" }}>
                بدون تصویر
              </div>
            )}
            <div className="p-4">
              <span className="text-xs text-muted">{p.projectType || "—"}</span>
              <h2 className="font-semibold">{p.title}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {!p.published && <Badge tone="amber">پیش‌نویس</Badge>}
                {p.featured && <Badge tone="blue">ویژه</Badge>}
                {p.isCaseStudy && <Badge tone="green">مطالعه موردی</Badge>}
              </div>
            </div>
          </Link>
          {p.published && (
            <Link href={projectHref(p.slug)} target="_blank" className="block border-t border-line px-4 py-2 text-xs">
              مشاهده در سایت
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
