# وضعیت اجرای بلاگ

- شاخه: `feat/blog`؛ مبنا: `d4fd5d955c89a36fc5146d1382203dcce7b8b27f`، main محلی و remote یکسان و worktree پاک بود.
- مرحله جاری: بررسی نهایی و CI شاخه `feat/blog` در [PR #22](https://github.com/irancss/seodaily/pull/22)؛ merge فقط پس از سبز شدن SHA نهایی.
- زیرساخت موجود: TipTap و block document v1، uploads، slug registry با namespace blog، worker مستقل، PostgreSQL و Drizzle.
- قرارداد: snapshot عمومی مستقل از draft؛ version برای جلوگیری از lost update؛ alias به entity اشاره می‌کند؛ رسانه با Trash حذف نمی‌شود.
- baseline معتبر قبلی: CI/Deploy/Verify کامیت مبنا موفق؛ baseline محلی این اجرا و رگرسیون کامل در دست اجرا.
- هیچ مقاله یا دسته‌ای در production seed نخواهد شد. قابلیت‌های افزونه و تنظیمات لوگو حفظ می‌شوند.
- آزمون‌ها و نتیجه انتشار در پایان همین سند ثبت خواهند شد.

## checkpoint اجرا

- پیاده‌سازی: migration `0006_blog`، snapshot/revision/concurrency، زمان‌بندی در worker هر ۱۵ ثانیه، اسلایدر SSR با کنترل حرکت، SEO/sitemap، پنل و پیش‌نمایش، media picker، لینک entity و پیشنهاد قابل تأیید.
- تست‌های اجراشده: lint/typecheck/build موفق؛ ۷۴ unit موفق؛ integration شامل دو worker، snapshot، concurrency، slug، زمان ثابت، featured و pagination. ۵ تست DB از جمله upgrade با حفظ داده قبلی موفق. سه سفر مرورگر بلاگ شامل worker واقعی، axe مقاله، preview، 301، search، کاروسل و no-JS موفق. نتیجه نهایی integration و CI در تکمیل گزارش ثبت می‌شود.
- خطای واقعی اصلاح‌شده: JSON ادیتور باید پیش از عبور از Server Action serialize شود؛ attrs ادیتور ممکن است prototype ساده نداشته باشند.
- اصلاح تست موجود: اتصال فوری handler به Promise در تست quota دانلود؛ همان ۴۰ موفق و دو خطای ۴۲۹ بررسی می‌شوند و هیچ assertion حذف نشده است.
- محیط موقت: `seodaily-blog-test` و `seodaily-blog-db`؛ volumeهای `seodaily-blog-modules` و `seodaily-blog-build`. production fixture ندارد.
- checkpoint `2e4d4f7`: [CI 36572715127 موفق](https://github.com/irancss/seodaily/actions/runs/36572715127). اصلاحات نهایی روی SHA نهایی مجدداً CI می‌شوند.

## تفکیک محدودیت محیط محلی از نتیجه CI

SEO: ۱۶ موفق؛ security: ۹ موفق. اجرای کامل E2E در Docker Desktop محلی ۳۴ موفق و ۱۳ ناموفق از ۴۷ داشت؛ تست‌های اختصاصی بلاگ موفق بودند. شکست‌ها مربوط به نمایش فوری تغییرات بخش‌های قدیمی پس از invalidation بودند. برای مقایسه، main دست‌نخورده در کانتینر جدا build و همان journeys اجرا شد: ۱۰ موفق و ۱۰ ناموفق از ۲۰؛ تغییر تلفن، لوگو، FAQ، پروژه، تیم و منو روی baseline نیز مشکل داشتند. این مشاهده به‌تنهایی علت ریشه‌ای cache را ثابت نمی‌کند. معیار نهایی رگرسیون، suite کامل روی Ubuntu مستقل CI برای همان SHA نهایی است؛ هیچ assertion برای سبز کردن نتیجه حذف یا ضعیف نشد.

## اصلاحات نهایی و عملیات

- مقایسه عمیق JSONB مانع تغییر lastmod با انتشار بدون تغییر می‌شود.
- توضیح متای پیش‌فرض از متن واقعی و Breadcrumb schema فهرست/دسته افزوده شد؛ کارت‌ها و Home از کلاس‌های واقعی قالب استفاده می‌کنند.
- audit، URL خراب را بدون crash گزارش می‌کند؛ incoming شامل entity و URL دستی/alias است و مقصد بیرونی fetch نمی‌شود.
- ابعاد تصاویر از فایل واقعی و alt تصویر دسته نیز اعتبارسنجی می‌شود.
- deploy علاوه بر health برنامه، heartbeat زمان‌بند همان APP_VERSION را فقط‌خواندنی بررسی می‌کند.
- جزئیات در [تصمیم‌ها و عملیات](DECISIONS-AND-BLOCKERS.md)، [ماتریس آزمون](TEST-MATRIX.md) و [راهنمای فارسی مدیر](ADMIN-GUIDE.fa.md).
- سرویس یا secret جدیدی لازم نیست؛ PostgreSQL و uploads موجود پایدارند. migration افزایشی است و rollback برنامه دیتابیس یا رسانه را حذف نمی‌کند.
- زمان ورودی میلادی/تهران و نمایش تاریخ شمسی است. مقاله و دسته واقعی را مدیر وارد می‌کند؛ تا اولین انتشار، سکشن Home مخفی است.
- fixture روی production ساخته نمی‌شود؛ اثبات زمان‌بندی از worker واقعی محیط موقت، CI کامل و heartbeat نسخه مستقر تشکیل می‌شود.
- اعداد عملکرد محلی field data یا تضمین سرعت همه کاربران نیستند. شواهد بصری/عملکرد و انتشار نهایی در تکمیل گزارش ثبت می‌شوند.
