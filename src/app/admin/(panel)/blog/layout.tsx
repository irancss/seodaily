import Link from "next/link";
export default function BlogAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="grid min-w-0 gap-6"><nav aria-label="مدیریت بلاگ" className="flex flex-wrap gap-3 text-sm"><Link className="btn btn-secondary h-10 px-4" href="/admin/blog">مقاله‌ها</Link><Link className="btn btn-secondary h-10 px-4" href="/admin/blog/categories">دسته‌ها</Link><Link className="btn btn-secondary h-10 px-4" href="/admin/blog/settings">تنظیمات بلاگ</Link></nav>{children}</div>;
}
