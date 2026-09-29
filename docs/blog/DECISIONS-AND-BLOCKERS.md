# تصمیم‌ها، عملیات و محدودیت‌های بلاگ

## قرارداد معماری

- داده‌ها در چهار جدول افزوده‌شده با migration `0006_blog` هستند: مقاله، دسته، revision و لینک محتوایی. روابط خدمات و ترتیب related داخل snapshot JSON نسخه‌دار نگهداری می‌شوند تا انتشار یک سند اتمیک باشد؛ شناسه مقصد در سرور اعتبارسنجی می‌شود.
- document v1، TipTap، uploader، slug registry و worker موجود بازاستفاده شده‌اند. namespace بلاگ مستقل از plugins است. شناسه‌های ثابت TOC فقط برای بلاگ فعال شده‌اند؛ لینک‌های قدیمی هدینگ افزونه تغییر نکرده‌اند.
- draft خصوصی است؛ public queries فقط snapshot منتشرشده را می‌خوانند. مقاله در یک request با React cache یک snapshot مشترک برای metadata و body دارد؛ داده‌های عمومی بلاگ shared-cache ساعتی ندارند، پس تغییر وضعیت و موعد انتشار پشت 404 یا نتیجه جست‌وجوی قدیمی نمی‌ماند.
- worker هر ۱۵ ثانیه ردیف‌های due را با `FOR UPDATE SKIP LOCKED` می‌گیرد. revision مورد انتظار، تغییر/لغو برنامه قبلی را بی‌اثر می‌کند. publish/revision/aliases/link index یک تراکنش‌اند. پس از commit، invalidation عمومی موجود فراخوانی می‌شود. شکست اعتبارسنجی در savepoint، پیام قابل اصلاح ذخیره می‌کند.
- علامت حیات `blogSchedulerAt` در health worker، هشدار پنل و بررسی فقط‌خواندنی deploy دارد. cron ساعت ۰۳ افزونه‌ها تغییر نکرده است.
- تصویر در volume موجود uploads است؛ اطلاعات خصوصی افزونه‌ها از plugin-files وارد رسانه نمی‌شود. `sharp@0.35.4` قبلاً وابستگی Next بود و برای خواندن ابعاد واقعی به‌صورت مستقیم ثبت شد (MIT). پکیج ادیتور/صف/هوش مصنوعی جدیدی اضافه نشده است.

## پیش‌فرض‌ها و سیاست‌ها

- ۱۲ مقاله در صفحه، autoplay شش ثانیه، ۲۰۰ کلمه در دقیقه و چهار مرتبط: قابل تنظیم در پنل.
- یک دسته اصلی؛ خدمات چندگانه و related دستی در snapshot. نویسنده ثابت سازمان «سئو دیلی».
- تاریخ ورودی زمان‌بندی میلادی با منطقه تهران؛ تاریخ خروجی شمسی و `<time datetime>` استاندارد UTC. ایران در تاریخ این نیازمندی UTC+03:30 بدون DST است؛ سیاست در تست مرز روز ثبت شده است.
- archive/trash مسیر را 404 می‌کند و نامک را نگه می‌دارد؛ حذف دائمی و RSS، tag، comment، rating، view counter، newsletter و قبلی/بعدی مقاله وجود ندارند.
- تصویر OG پیش‌فرض featured است. crop اجباری ۱۲۰۰×۶۳۰ تولید نمی‌شود تا تصویر مدیر بریده نشود؛ override OG اختیاری است. WebP از optimizer موجود Next می‌آید.
- پیشنهاد لینک قواعد محلی دسته/خدمت/واژه مشترک است؛ معنای قطعی متن یا توصیه هوشمندانه ادعا نمی‌شود. audit خروجی حداکثر ۱۰۰ لینک متمایز/نمایشی را بررسی می‌کند و هیچ URL خارجی fetch نمی‌شود.
- صفحه‌های خالی و search noindex هستند؛ page 2 canonical خودش را دارد. sitemap فقط URLهای public/indexable/self-canonical را نگه می‌دارد.

## داده پایدار، پشتیبان و rollback

- جدول‌های blog و slug registry در PostgreSQL موجود‌اند و با backup دیتابیس فعلی پوشش داده می‌شوند. تصاویر در همان volume uploads و همان مسیر پشتیبان موجود هستند. revisionها و رسانه‌های حذف‌شده از نمایش عمومی خودکار پاک نمی‌شوند؛ رشد آن‌ها باید با پایش دیسک موجود کنترل شود.
- تغییر migration فقط افزایشی است. تست upgrade، محتوا/کاربران/لوگوهای نسخه قبلی را حفظ می‌کند و seed هیچ محتوای بلاگی نمی‌سازد.
- rollback برنامه: از فرایند rollback موجود `deploy/ops/deploy.sh` و tag نسخه سالم قبلی استفاده شود. در بازگشت به نسخه پیش از بلاگ، جدول‌ها و media نگه داشته شوند؛ migration معکوس، reset دیتابیس و حذف volume انجام نشود. worker قدیمی انتشار بلاگ را انجام نمی‌دهد؛ بعد از بازگشت به نسخه سازگار، موعدهای عقب‌افتاده بازیابی می‌شوند.
- secret یا سرویس بیرونی تازه لازم نیست. همان DATABASE_URL، UPLOAD_DIR، APP_INTERNAL_URL و INTERNAL_API_SECRET موجود استفاده می‌شوند؛ مقدار آن‌ها در گزارش ثبت نمی‌شود.

## راستی‌آزمایی منابع

در این اجرا مستندات رسمی [Article](https://developers.google.com/search/docs/appearance/structured-data/article)، [Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)، [Pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) و [کنترل کاروسل WAI](https://www.w3.org/WAI/tutorials/carousels/) بررسی شد. داده ساختاریافته فقط محتوای واقعی را بازتاب می‌دهد و تضمین rich result نیست.

## وضعیت بیرونی

بلاگ با نسخه `77a1d0310619` مستقر و `VERIFIED LIVE` است؛ check/deploy/verify اجرای `36576626731` موفق‌اند. heartbeat واقعی زمان‌بند نیز تأیید شد. برای اثبات انتشار، مقاله آزمایشی روی production ساخته نشد؛ publication کامل در worker مستقل محیط موقت و CI آزموده شد. محتوای واقعی را مدیر وارد می‌کند. جزئیات نتایج، محدودیت رگرسیون Docker Desktop و SHAها در IMPLEMENTATION-REPORT ثبت شده‌اند.
