import type { MenuItem, Menus } from "./types";

let counter = 0;
function item(label: string, url: string, children: MenuItem[] = []): MenuItem {
  counter++;
  return { id: `d${counter}`, label, url, children };
}

function defaultTree(): MenuItem[] {
  counter = 0;
  return [
    item("صفحه اصلی", "/"),
    item("طراحی سایت", "/web-design", [
      item("طراحی سایت شرکتی", "/services/corporate-website"),
      item("طراحی فروشگاه اینترنتی", "/services/online-store"),
      item("طراحی سایت خدماتی", "/services/service-website"),
      item("طراحی Landing Page", "/services/landing-page"),
      item("بازطراحی سایت", "/services/website-redesign"),
    ]),
    item("سئو", "/seo", [
      item("بررسی و ممیزی سئو", "/services/seo-audit"),
      item("سئو تکنیکال", "/services/technical-seo"),
      item("تحقیق کلمات کلیدی", "/services/keyword-research"),
      item("استراتژی محتوا", "/services/content-strategy"),
      item("سئو داخلی", "/services/on-page-seo"),
    ]),
    item("تعرفه‌ها", "/pricing"),
    item("نمونه‌کارها", "/portfolio"),
    item("درباره ما", "/about"),
    item("تماس با ما", "/contact"),
  ];
}

export function defaultMenus(): Menus {
  return { desktop: defaultTree(), mobile: defaultTree() };
}
