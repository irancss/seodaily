export const WHY_US: { title: string; text: string; icon: string }[] = [
  { title: "طراحی متناسب با کسب‌وکار", text: "هر کسب‌وکار نیاز، مخاطب و مسیر فروش متفاوتی دارد.", icon: "palette" },
  { title: "ساختار فنی قابل توسعه", text: "سایت باید امروز نیاز کسب‌وکار را پاسخ دهد و فردا محدودش نکند.", icon: "layers" },
  { title: "توجه همزمان به کاربر و سئو", text: "ساختار صفحات از ابتدا با تجربه کاربری و موتور جست‌وجو هماهنگ شود.", icon: "target" },
  { title: "تصمیم بر اساس داده", text: "در پروژه‌های سئو، تصمیم‌ها باید بر اساس داده و وضعیت واقعی سایت باشند.", icon: "bar-chart" },
];

export const CATEGORY_UI: Record<string, { icon: string; href: string; cta: string }> = {
  "web-design": { icon: "layout", href: "/web-design", cta: "مشاهده خدمات طراحی سایت" },
  seo: { icon: "search-minus", href: "/seo", cta: "مشاهده خدمات سئو" },
};

/** Short promises shown as chips under the home hero. */
export const HERO_POINTS = ["طراحی اختصاصی و ریسپانسیو", "سئو از روز اول", "پنل مدیریت ساده"];
