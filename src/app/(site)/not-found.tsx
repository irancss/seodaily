import { SiteNotFound } from "@/components/templates";

export const metadata = { title: "صفحه پیدا نشد", robots: { index: false } };

export default function NotFound() {
  return <SiteNotFound />;
}
