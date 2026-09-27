/** Rows of the «which service do I need» selector: the visitor's situation and the suggested path. */
export const SELECTOR: { situation: string; path: string; href: string; icon: string }[] = [
  { situation: "هنوز سایت ندارم", path: "طراحی سایت", href: "/web-design", icon: "layout" },
  { situation: "سایت دارم اما نیاز به بازطراحی دارد", path: "بررسی و بازطراحی", href: "/services/website-redesign", icon: "refresh" },
  { situation: "سایت دارم اما ورودی گوگل کافی نیست", path: "بررسی سئو", href: "/seo", icon: "search-minus" },
];

/** Icon of each main service category, by slug (other categories fall back to «layers»). */
export const CATEGORY_ICONS: Record<string, string> = {
  "web-design": "layout",
  seo: "search-minus",
};
