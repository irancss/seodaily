# راهنمای عملیات — کتابخانه افزونه‌ها

## اجزا روی سرور

| جزء | کجا | توضیح |
| --- | --- | --- |
| وب‌اپ | سرویس `app` (Image `seodaily:<tag>`) | صفحات، پنل، OTP، تحویل فایل (`/plugins/{slug}/download/{grant}`)، `POST /api/internal/revalidate` |
| Worker | سرویس `worker` (همان Image، `entrypoint.sh worker` → `node worker.mjs`) | بررسی منابع، دانلود و کنترل بسته، زمان‌بندی ۰۳:۰۰ تهران، پاک‌سازی ساعتی. بدون پورت، `mem_limit: 768m` |
| فایل‌ها | Volume `seodaily_plugin_files` در `/app/plugin-files` | `objects/<aa>/<sha256>.zip` و `tmp/*.part`؛ نه در Git، نه در `public`، نه در `uploads` |
| داده | PostgreSQL (migration `0004_plugins_library`، ۱۷ جدول) | صف، زمان‌بندی، نسخه‌ها، OTP، نشست‌ها، ledger دانلود، audit |

`ops/deploy.sh` پس از سالم‌شدن app، worker را هم با همان Image بالا می‌آورد؛ در بازگشت خودکار هر دو برمی‌گردند. Worker روی `SIGTERM` تا ۲۵ ثانیه کارهای جاری را تمام می‌کند؛ کار نیمه‌تمام پس از انقضای lease دوباره اجرا می‌شود (idempotent: هیچ فایل/نسخه تکراری ساخته نمی‌شود).

## تنظیمات (`/opt/seodaily/.env`)

| نام | پیش‌فرض | معنی |
| --- | --- | --- |
| `OTP_HMAC_SECRET` | ساخته‌شده توسط deploy | کلید HMAC کد و IP؛ بیرون از DB. تغییرش کدهای باز را باطل می‌کند |
| `INTERNAL_API_SECRET` | ساخته‌شده توسط deploy | ابطال کش سایت توسط worker (فقط در هدر) |
| `MELIPAYAMAK_USERNAME` / `MELIPAYAMAK_PASSWORD` / `MELIPAYAMAK_OTP_BODY_ID` | خالی | پیامک کد. **خالی = دانلود بسته** (fail closed) |
| `DOWNLOAD_TEST_PHONES` | خالی | شماره‌های آزمون (E.164، با کاما)؛ دانلودشان عمومی شمرده نمی‌شود |
| `PLUGINS_DOWNLOADS_ENABLED` | `true` | کلید کل دانلود |
| `PLUGINS_AUTO_UPDATE_ENABLED` | `true` | انتشار خودکار (با وجود آن، بدون اسکنر و آزمون ایزوله چیزی خودکار منتشر نمی‌شود) |
| `CLAMD_HOST` / `CLAMD_PORT` | خالی / 3310 | ClamAV |
| `CLAMAV_MAX_SIGNATURE_AGE_H` | 72 | امضای قدیمی‌تر = اسکن UNAVAILABLE |
| `PLUGIN_SANDBOX_URL` | خالی | Runner ایزوله (هنوز قرارداد پیاده نشده؛ UNAVAILABLE) |
| `OTP_LENGTH` / `OTP_TTL_S` / `OTP_MAX_ATTEMPTS` / `OTP_RESEND_S` | 4 / 120 / 5 / 60 | مقادیر محصول |
| `OTP_SENDS_PER_PHONE_HOUR` / `OTP_SENDS_PER_IP_HOUR` / `OTP_DAILY_BUDGET` | 5 / 20 / 500 | سقف ارسال (افزوده مهندسی) |
| `OTP_FAILURES_PER_PHONE_HOUR` / `OTP_FAILURES_PER_IP_HOUR` | 15 / 40 | سقف تلاش ناموفق |
| `DOWNLOAD_SESSION_DAYS` / `DOWNLOAD_GRANT_MIN` | 30 / 10 | نشست و لینک |
| `DOWNLOADS_PER_PHONE_HOUR` / `DOWNLOADS_PER_IP_HOUR` | 20 / 40 | سقف دانلود منطقی |
| `PLUGIN_MAX_ZIP_MB` / `PLUGIN_MAX_UNPACKED_MB` / `PLUGIN_MAX_ENTRIES` / `PLUGIN_MAX_RATIO` | 100 / 400 / 20000 / 200 | سقف‌های ZIP |
| `PLUGIN_FETCH_TIMEOUT_S` / `PLUGIN_DOWNLOAD_TIMEOUT_S` / `PLUGIN_MAX_HTML_KB` | 30 / 300 / 3072 | سقف‌های دریافت |
| `PLUGIN_DISK_MIN_FREE_MB` | 2048 | کمتر از این: دانلود بسته جدید متوقف + هشدار پنل |
| `PLUGIN_TMP_TTL_H` / `PLUGIN_REJECTED_TTL_D` / `PLUGIN_RETIRED_GRACE_MIN` | 6 / 7 / 60 | پاک‌سازی |
| `PLUGIN_WORKER_CONCURRENCY` | 2 | کار هم‌زمان |

`PLUGIN_FETCH_ALLOW_PRIVATE_FOR_TESTS` و `SMS_TEST_OUTBOX` فقط برای آزمون‌اند و در `NODE_ENV=production` بیرون از CI نادیده/رد می‌شوند. هرگز روی سرور تنظیم نکنید.

پس از تغییر `.env`: `docker compose up -d app worker` در `/opt/seodaily`.

## فعال‌کردن پیامک (Blocker B1)

1. در پنل ملی‌پیامک یک **الگوی خدماتی** با یک متغیر (کد) بسازید و تأیید بگیرید؛ شناسه عددی آن `MELIPAYAMAK_OTP_BODY_ID` است.
2. نام کاربری و رمز وب‌سرویس را در `.env` بگذارید و سرویس‌ها را بالا بیاورید.
3. با یک شماره آزمون مجاز (در `DOWNLOAD_TEST_PHONES`) یک بار کد بگیرید. در «دانلودکنندگان و آمار» وضعیت ارسال دیده می‌شود.
4. قرارداد استفاده‌شده: `POST https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber` با `username, password, text, to, bodyId`؛ موفقیت فقط وقتی `RetStatus = 1` و `Value` شناسه عددی بلند است. اتصال واقعی در این اجرا آزموده نشد (NOT VERIFIED).

## ClamAV (Blocker B2)

- یک clamd جدا (مثلاً کانتینر `clamav/clamav` در همین شبکه Compose، یا سرویس سیستمی) با `StreamMaxLength` ≥ سقف ZIP و **`AlertExceedsMax yes`** (وگرنه محتوای بیش از سقف بی‌صدا رد می‌شود). RAM حدود ۱.۲ گیگابایت.
- به‌روزرسانی امضا (freshclam) باید کار کند؛ امضای قدیمی‌تر از ۷۲ ساعت = UNAVAILABLE.
- `CLAMD_HOST=<نام سرویس یا IP>`، سپس `docker compose up -d worker`. وضعیت در «پایش به‌روزرسانی».

## Runner ایزوله وردپرس (Blocker B3)

روی این سرور اجرا نمی‌شود و نباید بشود. نیاز: VM/sandbox جدا، بدون secret، volume سایت، Docker socket و شبکه؛ وردپرس/DB دورریختنی با نسخه مشخص PHP/WP؛ deadline و پاک‌سازی. قرارداد ورودی/خروجی در `src/modules/plugins/pipeline/sandbox.ts`. تا آن زمان انتشار با تأیید دستی مدیر.

## پشتیبان و بازیابی

- `ops/backup.sh daily` (cron شبانه): dump دیتابیس، `uploads`، و **`plugin-files-*.tar`** (فقط `objects/`؛ ۳ نسخه آخر نگه داشته می‌شود).
- بازیابی فایل‌ها (در صورت از دست رفتن volume):
  ```sh
  cd /opt/seodaily
  docker compose run --rm --no-deps -T --entrypoint sh app -c 'tar xf - -C /app/plugin-files' < ~/seodaily-backups/plugin-files-<STAMP>.tar
  ```
  ردیف‌های نسخه با `storage_key` به همان مسیرها اشاره می‌کنند؛ فایلی که در پشتیبان نباشد در دانلود «فایل پیدا نشد» (۵۰۳) می‌دهد و با «برداشتن فایل» یا بررسی دوباره منبع جایگزین می‌شود.
- بازیابی دیتابیس مثل قبل (`deploy/RUNBOOK.md`). Migration فقط اضافه می‌کند؛ rollback کد نیازی به برگرداندن DB ندارد.

## Rollback

`sh ops/rollback.sh` (یا `<tag>`): app و worker به Image قبلی برمی‌گردند. جدول‌های افزونه در نسخه قبلی استفاده نمی‌شوند و آسیبی نمی‌بینند. غیرفعال‌کردن سریع بدون rollback: `PLUGINS_DOWNLOADS_ENABLED=false` و/یا `docker compose stop worker`.

## عیب‌یابی

| نشانه | بررسی |
| --- | --- |
| «پردازشگر بی‌پاسخ» در پایش | `docker compose ps worker`، `docker compose logs --tail 100 worker` |
| کار «ناموفق» | گزارش کار در صفحه منابع افزونه؛ سه تلاش با backoff (۲، ۴، ۸ دقیقه) |
| منبع `MANUAL_SETUP_REQUIRED` | «آزمایش منبع» و تنظیم selector/لینک مستقیم |
| دانلود «موقتاً فعال نیست» | `OTP_HMAC_SECRET` و سه متغیر ملی‌پیامک در `.env` app |
| ۵۰۳ «فایل پیدا نشد» | volume/پشتیبان فایل‌ها؛ رویداد `failed` با `file missing` |
| دیسک | پایش ← فضای آزاد؛ `docker system df`؛ به uploads، backup یا volume دیتابیس دست نزنید |

## امنیت عملیاتی

- کد OTP، توکن نشست و شماره در لاگ نوشته نمی‌شوند؛ لاگ کارها URLها را بدون query string نگه می‌دارد.
- پاسخ‌های OTP، لینک و فایل `Cache-Control: private, no-store` و `noindex` دارند.
- IP فقط از `X-Real-IP` که Nginx بازنویسی می‌کند خوانده می‌شود (app فقط روی 127.0.0.1 گوش می‌دهد).
- خروجی CSV فقط برای مدیر واردشده، با audit، و روی دیسک نوشته نمی‌شود.
