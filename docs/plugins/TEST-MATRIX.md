# ماتریس آزمون — کتابخانه افزونه‌ها

اجرا: `npm run test:unit` · `DATABASE_URL=… npm run test:integration` (DB یک‌بارمصرف) · `npm run test:e2e` (سرور ساخته‌شده + worker + منبع fixture محلی؛ فقط CI/محلی) · `npm run test:seo|test:security|test:db`.

وضعیت‌ها: **TESTED LOCAL** = اجرا و سبز در این محیط · **CI** = در GitHub Actions همین شاخه · **BLOCKED** = نیازمند زیرساخت/credential بیرونی.

| ID | آزمون | کجا | وضعیت |
| --- | --- | --- | --- |
| PL-T01 | دسته و افزونه هم‌slug حتی هم‌زمان؛ alias و رزرو | `tests/integration/slugs.test.mjs`، `tests/unit/slugs.test.mjs` | TESTED LOCAL |
| PL-T02 | ساخت پیش‌نویس، چند دسته/اصلی، ادیتور، انتشار، پیش‌نمایش؛ draft = 404؛ ذخیره دوم و تب کهنه بدون ازدست‌رفتن متن | `tests/e2e/plugins.test.mjs` + smoke مرورگری ادیتور (P02) | TESTED LOCAL |
| PL-T03 | متادیتای منبع/بسته فیلد دستی، خلاصه و SEO را overwrite نکند | `plugin-pipeline.test.mjs` | TESTED LOCAL |
| PL-T04 | منبع کم‌اولویت جدیدتر برنده؛ `1.10 > 1.9`؛ prerelease/ناشناخته | `tests/unit/plugin-versions.test.mjs`، `plugin-pipeline.test.mjs` | TESTED LOCAL |
| PL-T05 | خطای یک منبع، fallback، partial | `plugin-pipeline.test.mjs` (منبع ۴۰۴ → منبع دوم) | TESTED LOCAL |
| PL-T06 | اختلاف نسخه منبع/بسته فقط هشدار؛ بسته افزونه دیگر = FAIL هویت | `plugin-pipeline.test.mjs` | TESTED LOCAL |
| PL-T07 | نسخه برابر با فایل متفاوت → نسخه منتظر بررسی با هشدار؛ بدون overwrite/downgrade؛ فایل یکسان یک بار مقایسه | `plugin-pipeline.test.mjs` | TESTED LOCAL |
| PL-T08 | SSRF: IPv4/IPv6 خصوصی، mapped، metadata، redirect، DNS به loopback، نام محلی با نقطه انتهایی | `tests/unit/plugin-ssrf.test.mjs`، E2E (ذخیره منبع metadata رد) | TESTED LOCAL |
| PL-T09 | HTML به‌جای ZIP، ناقص، traversal، مطلق، symlink، رمزدار، bomb، CRC، تکراری، قالب، ZIP تودرتو | `tests/unit/plugin-zip.test.mjs`، `plugin-pipeline.test.mjs` | TESTED LOCAL |
| PL-T10 | اسکنر در دسترس نیست/امضای قدیمی/timeout/ناقص ≠ PASS | `plugin-pipeline.test.mjs` (UNAVAILABLE → review)؛ منطق `scan.ts` (سن امضا، Limits.Exceeded) | TESTED LOCAL (clamd واقعی: BLOCKED B2) |
| PL-T11 | Runner نصب/فعال‌سازی/fatal/وابستگی/timeout و ایزوله‌سازی | فقط interface و UNAVAILABLE | **BLOCKED** (B3) |
| PL-T12 | نبود checksum رسمی = UNAVAILABLE | `plugin-pipeline.test.mjs`، E2E | TESTED LOCAL |
| PL-T13 | انتشار فقط همان hash؛ فایل دستکاری‌شده رد؛ انتشار دستی نیازمند دلیل | `plugin-pipeline.test.mjs` | TESTED LOCAL |
| PL-T14 | نسخه چهارم → دقیقاً ۳ قابل دانلود، جدیدترین جاری | `plugin-pipeline.test.mjs` | TESTED LOCAL |
| PL-T15 | cleanup با grant فعال/Range و فایل مشترک؛ TTL فایل موقت | `plugin-pipeline.test.mjs` (grant زنده، مهلت retire، SHA مشترک)؛ `storage.cleanTemp` | TESTED LOCAL |
| PL-T16 | دو scheduler/کلیک → یک کار؛ lease منقضی، fencing، retry | `plugin-pipeline.test.mjs`، E2E (کلیک دوم به همان کار) | TESTED LOCAL |
| PL-T17 | ۰۳:۰۰ تهران مستقل از TZ میزبان | `tests/unit/plugin-schedule.test.mjs` (با `TZ=America/Los_Angeles` و `Asia/Tokyo`)، `plugin-pipeline.test.mjs` | TESTED LOCAL |
| PL-T18 | همه شکل‌های شماره ایران → یک کاربر؛ غیرایران رد | `tests/unit/download-phone.test.mjs`، `downloads.test.mjs` | TESTED LOCAL |
| PL-T19 | کد ۴ رقمی رشته‌ای، expiry ثانیه ۱۲۰، مصرف دوباره، دستکاری phone/purpose | `tests/integration/downloads.test.mjs` | TESTED LOCAL |
| PL-T20 | ۵ تلاش اتمیک با ۸ حدس هم‌زمان؛ resend زودتر از ۶۰ ثانیه؛ شمارنده خطا با resend ریست نشود | `downloads.test.mjs` | TESTED LOCAL |
| PL-T21 | خطای business با HTTP 200 = شکست؛ ارسال ناموفق باطل؛ timeout = unknown بدون ارسال خودکار | `download-phone.test.mjs`، `downloads.test.mjs` | TESTED LOCAL (سرویس واقعی: BLOCKED B1) |
| PL-T22 | نشست ۳۰ روزه، مرورگر دیگر، انقضا/خروج/ابطال/مسدودی؛ جدا از مدیر | `downloads.test.mjs`، E2E (کوکی HttpOnly/Lax) | TESTED LOCAL |
| PL-T23 | بدون OTP یا با نشست دیگری فایل نمی‌دهد | `downloads.test.mjs`، E2E (مرورگر دیگر ۴۰۳) | TESTED LOCAL |
| PL-T24 | لینک ۱۰ دقیقه‌ای، انقضا، لینک تازه، HEAD/Range، فایل گم‌شده، فایل پس‌گرفته‌شده | `downloads.test.mjs`، E2E | TESTED LOCAL |
| PL-T25 | ۲۱مین دانلود شماره و ۴۱مین IP (هم‌زمان)؛ هدر proxy جعلی بی‌اثر | `downloads.test.mjs`؛ IP فقط از `X-Real-IP` که Nginx بازنویسی می‌کند (`lib/rate-limit.ts`، آزمون امنیتی قبلی) | TESTED LOCAL |
| PL-T26 | HEAD، صدور لینک، retry، ربات شمرده نشوند | `downloads.test.mjs`، E2E | TESTED LOCAL |
| PL-T27 | عدد پایه جدا؛ served هم‌زمان یک بار؛ تطبیق با ledger | `downloads.test.mjs` | TESTED LOCAL |
| PL-T28 | served/failed/unknown دقیق؛ ادعای ذخیره روی رایانه نشود | `downloads.test.mjs`؛ متن داشبورد | TESTED LOCAL |
| PL-T29 | CSV: دسترسی، audit، فرمول، UTF-8، شماره | `tests/unit/download-csv.test.mjs` + smoke مرورگری (بدون ورود → ریدایرکت) | TESTED LOCAL |
| PL-T30 | بلوک سراسری در صفحه، جایگاه قبل از دانلود، anchor یکتا | E2E | TESTED LOCAL |
| PL-T31 | جست‌وجو/فیلتر/صفحه‌بندی، Home حداکثر ۶ | E2E + smoke مرورگری (`?q=%` بدون نتیجه، صفحه خارج از محدوده ۴۰۴) | TESTED LOCAL |
| PL-T32 | sitemap، noindex جست‌وجو، canonical، JSON-LD بدون امتیاز/قیمت/لینک خصوصی، ۴۰۴ | E2E، `tests/seo.test.mjs` | TESTED LOCAL |
| PL-T33 | ۳۲۰/۷۶۸/۱۴۴۰، axe WCAG 2.2 AA روی صفحه افزونه، دسته و دیالوگ باز، فوکوس در دیالوگ | E2E، `tests/e2e/a11y.test.mjs` (+ `/plugins` و صفحات پنل افزونه) | TESTED LOCAL |
| PL-T34 | restart/deploy فایل‌ها و صف را پاک نکند | Volume نام‌دار `plugin_files`، صف و OTP در DB؛ کار قطع‌شده با lease برمی‌گردد | IMPLEMENTED (روی سرور: بعد از استقرار) |
| PL-T35 | Migration از DB خالی و وضعیت موجود، رگرسیون کامل | migration ۰۰۰۴ روی DB خالی و تکراری؛ `test:db`، `test:seo`، `test:security`، `test:e2e` (۴۲)، unit (۶۳)، integration (۲۶) | TESTED LOCAL |
