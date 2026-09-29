# وضعیت اجرای بلاگ

- شاخه: `feat/blog`؛ مبنا: `d4fd5d955c89a36fc5146d1382203dcce7b8b27f`، main محلی و remote یکسان و worktree پاک بود.
- وضعیت نهایی: `IMPLEMENTED`، `TESTED LOCAL`، `PUSHED`، `CI PASSED`، `DEPLOYED` و `VERIFIED LIVE`؛ [PR #22](https://github.com/irancss/seodaily/pull/22) پس از CI موفق مرج شد.
- زیرساخت موجود: TipTap و block document v1، uploads، slug registry با namespace blog، worker مستقل، PostgreSQL و Drizzle.
- قرارداد: snapshot عمومی مستقل از draft؛ version برای جلوگیری از lost update؛ alias به entity اشاره می‌کند؛ رسانه با Trash حذف نمی‌شود.
- baseline معتبر قبلی: CI/Deploy/Verify کامیت مبنا موفق؛ مقایسه محلی با main و رگرسیون کامل CI در این اجرا نیز انجام شد.
- هیچ مقاله یا دسته‌ای در production seed نخواهد شد. قابلیت‌های افزونه و تنظیمات لوگو حفظ می‌شوند.
- آزمون‌ها و نتیجه انتشار در ادامه همین سند ثبت شده‌اند.

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

## نتیجه نهایی PR و بررسی بصری

- کامیت نهایی پیاده‌سازی: `bf52e92690ce04557149f4bd49d3cd14ff22ef82`؛ [CI نهایی 36575657862](https://github.com/irancss/seodaily/actions/runs/36575657862) موفق: ۷۴ unit، ۴۶ integration، ۱۶ SEO، ۹ security، ۴۷ E2E و ۵ DB، همگی بدون شکست. نصب تمیز lockfile، lint، shellcheck، typecheck و production build نیز موفق.
- [PR #22](https://github.com/irancss/seodaily/pull/22) در ۲۰۲۶-۰۹-۲۹ ساعت ۱۳:۳۸ UTC مرج شد؛ main برنامه `77a1d0310619ecdbf4da09a54a4a4798fb4f6990`. main محلی با fast-forward همین merge همگام شد؛ هیچ اتوماسیون pull فعال نشده است.
- سه E2E اختصاصی بلاگ روی build نهایی محلی مجدداً موفق شدند. screenshotهای فهرست desktop، مقاله mobile/desktop، کاروسل mobile و ادیتور desktop بررسی شدند. فرم مقاله در ۳۲۰، ۳۹۰، ۷۶۸ و ۱۴۴۰ پیکسل overflow نداشت.
- سنجش آزمایشگاهی Docker Desktop/Chromium، عرض ۱۴۴۰، بدون throttling و با reduced motion: میانه TTFB Home مبنا ۱۵ms، Home با هشت کارت ۱۹ms و مقاله ۲۰ms. HTML به ترتیب ۲۲۳۶۳۸، ۲۵۳۴۵۷ و ۸۱۱۷۳ بایت؛ script payload فشرده گزارش‌شده توسط Resource Timing به ترتیب ۱۶۲۴۲۷، ۱۶۳۹۴۳ و ۱۶۳۷۰۵ بایت. CLS مشاهده‌شده در این اجراها صفر بود. این سنجش کوتاه محلی، نمونه مستقل و کنترل کامل cache یا field data نیست.
- fixtureهای بصری فقط در دیتابیس موقت بودند و پس از اندازه‌گیری از انتشار خارج شدند. تست مرورگر نهایی نیز fixtureهای خودش را پاک‌سازی منطقی کرد.

## انتشار و بررسی واقعی سایت — ۲۰۲۶-۰۹-۲۹

- [اجرای main شماره 36576626731](https://github.com/irancss/seodaily/actions/runs/36576626731): هر سه job `check`، `deploy` و `verify` موفق شدند. همان مجموع آزمون‌های CI بالا روی merge commit نیز بدون شکست تکرار شد.
- لاگ سرور: backup پیش از migration در ۱۳:۵۱:۳۷ UTC؛ `migrations applied` در ۱۳:۵۱:۴۱؛ نسخه `77a1d0310619` در ۱۳:۵۱:۴۶ فعال شد. بررسی فقط‌خواندنی heartbeat زمان‌بند همین نسخه در ۱۳:۵۱:۵۰ موفق بود.
- `/api/health`: وضعیت ok و نسخه `77a1d0310619`. `/blog`: HTTP 200، یک H1 و canonical صحیح. کتابخانه خالی noindex است. مسیر مقاله ناموجود و page نامعتبر 404؛ `/admin/blog` بدون ورود 307 به login. Home به دلیل نبود مقاله واقعی سکشن بلاگ ندارد و لینک فوتر موجود است.
- production: ۱۶ SEO موفق؛ security فقط‌خواندنی ۵ موفق و ۴ تست نوشتنی عمداً skipped؛ layout هشت عرض ۱۰ موفق؛ accessibility سه موفق و یک تست ورود پنل عمداً skipped؛ analytics کلیکی چهار موفق. شکست صفر. آزمون‌های نوشتنی پنل و انتشار واقعی worker در CI/محیط موقت اجرا شدند، نه روی داده سایت.
- محتوای واقعی تولید نشده و همه داده‌های تست بیرون production باقی ماندند. سه کانتینر موقت `seodaily-blog-test`، `seodaily-blog-db`، `seodaily-blog-baseline` و دو volume اختصاصی این کار پس از تکمیل شواهد حذف شدند؛ سایر محیط‌ها تغییری نکردند.
- این گزارش پس از استقرار در یک commit صرفاً مستندات به main افزوده می‌شود؛ نسخه اجرایی همان merge commit بالاست. تغییر مستندات طبق workflow دوباره برنامه را deploy نمی‌کند.
