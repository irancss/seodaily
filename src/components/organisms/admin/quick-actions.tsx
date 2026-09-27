import Link from "next/link";

export function QuickActions() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Link href="/admin/projects/new" className="btn btn-secondary h-12">افزودن نمونه‌کار</Link>
      <Link href="/admin/services/new" className="btn btn-secondary h-12">افزودن زیرخدمت</Link>
      <Link href="/admin/pages" className="btn btn-secondary h-12">ویرایش تایتل و متای صفحات</Link>
    </div>
  );
}
