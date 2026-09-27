export const PRINCIPLES: [string, string][] = [
  ["سادگی", "هر بخشی که به کاربر یا کسب‌وکار کمکی نکند کنار گذاشته می‌شود تا سایت ساده‌تر فهمیده و مدیریت شود."],
  ["شفافیت", "کارهای انجام‌شده، دلیل هر تصمیم و محدودیت‌های پروژه به‌روشنی با کارفرما در میان گذاشته می‌شود."],
  ["تصمیم مبتنی بر داده", "اولویت‌ها بر اساس وضعیت واقعی سایت، رفتار کاربران و داده‌های قابل اندازه‌گیری تعیین می‌شوند، نه حدس."],
  ["قابلیت توسعه", "ساختار سایت طوری ساخته می‌شود که افزودن صفحه، محصول یا بخش جدید در آینده به بازسازی کامل نیاز نداشته باشد."],
];

/** Icon of each principle, in the same order. */
export const PRINCIPLE_ICONS = ["sparkle", "message", "bar-chart", "grid-plus"];

export const METHOD: [string, string][] = [
  ["شناخت", "آشنایی با کسب‌وکار، مخاطبان و هدف پروژه."],
  ["تحلیل", "بررسی وضعیت فعلی سایت، رقبا و نیاز کاربران."],
  ["برنامه‌ریزی", "تعیین ساختار، اولویت‌ها و ترتیب کارها."],
  ["اجرا", "طراحی، پیاده‌سازی و بهینه‌سازی طبق برنامه."],
  ["اندازه‌گیری", "بررسی نتیجه کارها با داده‌های قابل اندازه‌گیری."],
  ["بهبود", "اصلاح بخش‌هایی که به بهبود نیاز دارند."],
];

/** The three qualities named in «نگاه ما به پروژه». */
export const VALUES: { title: string; icon: string }[] = [
  { title: "قابل استفاده", icon: "users" },
  { title: "قابل مدیریت", icon: "settings" },
  { title: "قابل توسعه", icon: "layers" },
];

/** Parts of the system drawn around the website in the about hero. */
export const SYSTEM_PARTS: { title: string; icon: string }[] = [
  { title: "طراحی", icon: "palette" },
  { title: "محتوا", icon: "pen" },
  { title: "ساختار فنی", icon: "code" },
  { title: "مسیر کاربر", icon: "cursor" },
];
