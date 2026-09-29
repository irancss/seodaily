# وضعیت اجرای بلاگ

- شاخه: `feat/blog`؛ مبنا: `d4fd5d955c89a36fc5146d1382203dcce7b8b27f`، main محلی و remote یکسان و worktree پاک بود.
- مرحله جاری: B11 رگرسیون و تست مرورگر؛ هنوز آماده merge نیست.
- زیرساخت موجود: TipTap و block document v1، uploads، slug registry با namespace blog، worker مستقل، PostgreSQL و Drizzle.
- قرارداد: snapshot عمومی مستقل از draft؛ version برای جلوگیری از lost update؛ alias به entity اشاره می‌کند؛ رسانه با Trash حذف نمی‌شود.
- baseline معتبر قبلی: CI/Deploy/Verify کامیت مبنا موفق؛ baseline محلی این اجرا و رگرسیون کامل در دست اجرا.
- هیچ مقاله یا دسته‌ای در production seed نخواهد شد. قابلیت‌های افزونه و تنظیمات لوگو حفظ می‌شوند.
- آزمون‌ها و نتیجه انتشار در پایان همین سند ثبت خواهند شد.

## checkpoint اجرا

- پیاده‌سازی: migration `0006_blog`، snapshot/revision/concurrency، زمان‌بندی در worker هر ۱۵ ثانیه، اسلایدر SSR با کنترل حرکت، SEO/sitemap، پنل و پیش‌نمایش، media picker، لینک entity و پیشنهاد قابل تأیید.
- تست‌های اجراشده: lint/typecheck/build موفق؛ ۷۴ unit و ۴۲ integration موفق؛ دو سفر مرورگر بلاگ موفق. تست‌های جدید زمان‌بندی worker، تاریخ ثابت، upgrade و رگرسیون کامل هنوز در حال اجرا هستند.
- خطای واقعی اصلاح‌شده: JSON ادیتور باید پیش از عبور از Server Action serialize شود؛ attrs ادیتور ممکن است prototype ساده نداشته باشند.
- اصلاح تست موجود: اتصال فوری handler به Promise در تست quota دانلود؛ همان ۴۰ موفق و دو خطای ۴۲۹ بررسی می‌شوند و هیچ assertion حذف نشده است.
- محیط موقت: `seodaily-blog-test` و `seodaily-blog-db`؛ volumeهای `seodaily-blog-modules` و `seodaily-blog-build`. production fixture ندارد.
- ادامه: آخرین build پس از تغییر table caption و audit، E2E کامل و scheduler واقعی، تست upgrade، بررسی بصری و دسترس‌پذیری، تکمیل اسناد، PR/CI، سپس merge و deploy/verify.
