# گزارش پیاده‌سازی — کتابخانه هوشمند افزونه‌های وردپرس

شاخه `feature/plugins-library` · وضعیت انتشار در بخش «انتشار و راستی‌آزمایی» پایین همین فایل.

وضعیت‌ها: IMPLEMENTED · TESTED LOCAL · PUSHED · CI PASSED · DEPLOYED · VERIFIED LIVE · BLOCKED · NOT VERIFIED

## ماتریس نیازمندی

| نیازمندی | پیاده‌سازی | آزمون | وضعیت |
| --- | --- | --- | --- |
| `/plugins`، `/plugins/{plugin}`، `/plugins/{category}` هم‌سطح | `src/app/(site)/plugins/page.tsx`، `[slug]/page.tsx` (resolver مشترک، ریدایرکت alias/املای غیرکانونی، ۴۰۴ واقعی) | PL-T01، PL-T32، E2E | TESTED LOCAL |
| Slug registry و رزرو | `src/modules/slugs/*`، جدول `slug_registry` | PL-T01 | TESTED LOCAL |
| چند دسته + دسته اصلی، CRUD و ترتیب | `modules/plugins/catalog.ts`، پنل `admin/(panel)/plugins/categories` | PL-T02 | TESTED LOCAL |
| ادیتور بلوکی واقعی + Renderer/Validator/TOC | `components/organisms/admin/block-editor/*`، `modules/blocks/*`، `organisms/blocks/block-renderer.tsx` | unit blocks، smoke ادیتور، E2E | TESTED LOCAL |
| پیش‌نویس/پیش‌نمایش/انتشار/بایگانی/بازگردانی، revision | `catalog.ts`، `admin/(preview)/plugins/[id]/preview` | PL-T02 | TESTED LOCAL |
| چند منبع، auto-detect + selector/regex/لینک دستی، آزمایش منبع | `pipeline/adapters.ts`، صفحه منابع | PL-T04/T05، smoke | TESTED LOCAL · اتصال واقعی منابع نمونه NOT VERIFIED (B4) |
| جدیدترین نسخه قابل مقایسه؛ اولویت فقط در تساوی | `pipeline/check.ts` (`rankCandidates`)، `versions.ts` | PL-T04 | TESTED LOCAL |
| Fetch امن (SSRF، rebinding، redirect، سقف‌ها) | `pipeline/safe-fetch.ts` | PL-T08 | TESTED LOCAL |
| دریافت streaming به فضای خصوصی، اعتبارسنجی ZIP | `safe-fetch.fetchToFile`، `pipeline/zip.ts`، `storage.ts` | PL-T09 | TESTED LOCAL |
| خواندن header/readme بدون اجرای PHP | `pipeline/header.ts` | unit zip | TESTED LOCAL |
| اسکن ClamAV | `pipeline/scan.ts` (INSTREAM، سن امضا، Limits) | PL-T10 | IMPLEMENTED · روی سرور BLOCKED (B2) |
| آزمون ایزوله WP-CLI | `pipeline/sandbox.ts` (interface، UNAVAILABLE) | — | BLOCKED (B3) |
| Checksum رسمی WordPress.org | `check.ts` (`officialChecksums`) | PL-T12 | TESTED LOCAL (fixture) |
| Gate انتشار، انتشار bind به hash، اتمیک | `pipeline/releases.ts` | PL-T13 | TESTED LOCAL |
| سقف ۳ نسخه قابل دانلود، پاک‌سازی reference-aware | `releases.ts`، `maintenance.ts` | PL-T14/T15 | TESTED LOCAL |
| زمان‌بندی ۰۳:۰۰ تهران، idempotent، catch-up | `pipeline/schedule*.ts` | PL-T17 | TESTED LOCAL |
| صف پایدار، lease/fencing/retry/لغو، worker جدا | `pipeline/jobs.ts`، `src/worker/main.ts`، سرویس Compose `worker` | PL-T16، E2E با worker واقعی | TESTED LOCAL |
| «بررسی همین الان» (enqueue)، پایش | `source-actions.ts`، `admin/(panel)/plugins/monitor` | E2E | TESTED LOCAL |
| هشدارها فقط در پنل | صفحه منابع و پایش؛ هیچ badge عمومی | بازبینی | IMPLEMENTED |
| نسخه منبع در صفحه، نسخه بسته جدا + هشدار اختلاف | `check.ts`، صفحه نسخه‌ها | PL-T06 | TESTED LOCAL |
| آیکون خودکار + override، گالری | آپلود مدیر؛ آیکون رسمی WordPress.org فقط به‌عنوان یادداشت کار | — | IMPLEMENTED (دانلود خودکار آیکون: پیشنهاد، نه اعمال) |
| صفحه کتابخانه (hero، جست‌وجو، دسته، تازه‌ها، پرطرفدار، صفحه‌بندی، فیلتر ساده) | `plugins/page.tsx`، `plugin-filters.tsx` | PL-T31، E2E | TESTED LOCAL |
| سکشن ۶ افزونه آخر در Home | `sections/home/plugins-section.tsx` | E2E | TESTED LOCAL |
| دانلودشمار = پایه + ثبت‌شده، audit پایه | `catalog.setBaseDownloadCount`، `grants.markServed` | PL-T27 | TESTED LOCAL |
| OTP ۴ رقم/۱۲۰ ثانیه/۵ تلاش/۶۰ ثانیه، HMAC | `modules/downloads/otp.ts` | PL-T19/T20 | TESTED LOCAL |
| ملی‌پیامک (خط خدماتی + الگو)، provider-independent | `modules/downloads/sms.ts` | PL-T21 | IMPLEMENTED · سرویس واقعی BLOCKED (B1) |
| نشست ۳۰ روزه، کوکی امن، جدا از مدیر | `otp.ts`، `downloads/session.ts` | PL-T22 | TESTED LOCAL |
| لینک ۱۰ دقیقه‌ای، Range/HEAD، تحویل stream | `downloads/grants.ts`، `plugins/[slug]/download/[grant]/route.ts` | PL-T23/T24 | TESTED LOCAL |
| سقف ۲۰/ساعت شماره و ۴۰/ساعت IP، اتمیک | `grants.authorizeFile` | PL-T25 | TESTED LOCAL |
| Rate limit + honeypot، بدون CAPTCHA، فقط شماره ایران | `otp.ts`، `download-flow.tsx`، `phone.ts` | PL-T18/T20 | TESTED LOCAL |
| رویدادها و معنای «کامل» | `download_events`، `grants.ts` | PL-T26/T28 | TESTED LOCAL |
| کاربران، تاریخچه، داشبورد، CSV امن | `downloads/admin*.ts`، `admin/(panel)/plugins/users`، `admin/plugins-export` | PL-T29، smoke | TESTED LOCAL |
| بلوک‌های سراسری با جایگاه و include/exclude | `catalog.saveGlobalBlock`، `plugin-page-view.tsx` | PL-T30 | TESTED LOCAL |
| SEO (متا، canonical، OG، JSON-LD صادقانه، sitemap، noindex) | `[slug]/page.tsx`، `sitemap.ts` | PL-T32، test:seo | TESTED LOCAL |
| دسترس‌پذیری و واکنش‌گرایی | axe روی صفحات جدید و دیالوگ | PL-T33 | TESTED LOCAL |
| استقرار: worker، volume، secretها، پشتیبان، status | `deploy/docker-compose.prod.yml`، `docker/entrypoint.sh`، `Dockerfile`، `deploy/ops/{deploy,backup,status}.sh` | shellcheck، `compose config` | IMPLEMENTED |

## معماری

```
مرورگر ─► Nginx ─► app (Next.js)
                     ├─ صفحات عمومی (کش با برچسب content)
                     ├─ پنل: کاتالوگ، منابع، نسخه‌ها، پایش، کاربران، CSV
                     ├─ Server Actions: OTP / verify / لینک دانلود
                     ├─ /plugins/{slug}/download/{grant} ─► stream از volume خصوصی
                     └─ /api/internal/revalidate (هدر secret)
worker (همان Image) ─► صف PostgreSQL (SKIP LOCKED + lease + fencing)
   ├─ زمان‌بندی ۰۳:۰۰ Asia/Tehran (یک ردیف برای هر روز)
   ├─ منابع ─► safe-fetch ─► adapters ─► انتخاب نسخه
   ├─ دانلود ─► tmp/*.part ─► بررسی ZIP ─► objects/<sha>.zip
   ├─ کنترل‌ها: هویت، نسخه، checksum، ClamAV، sandbox ─► gate
   └─ انتشار اتمیک + سقف ۳ نسخه ─► ابطال کش app
```

## داده و Migration

`drizzle/0004_plugins_library.sql` — ۱۷ جدول: `slug_registry`، `plugin_categories`، `plugins`، `plugin_category_links`، `plugin_sources`، `plugin_source_observations`، `plugin_releases`، `plugin_jobs`، `plugin_schedule_runs`، `worker_heartbeats`، `plugin_global_blocks`، `download_users`، `otp_challenges`، `download_sessions`، `download_grants`، `download_events`، `admin_audit`؛ با CHECKها (وضعیت‌ها، عدد پایه ≥ ۰، downloadable ⇒ published)، ایندکس‌های یکتا (slug، یک کار فعال برای هر افزونه، یک served برای هر grant) و ۱۵ slug رزرو. فقط افزایشی؛ روی DB خالی و DB موجود آزموده شد؛ اجرای دوم بی‌اثر است. هیچ seed ساختگی (افزونه، دسته، آمار) اضافه نشد.

## مسیرها

عمومی: `/plugins`، `/plugins/{slug}` (افزونه یا دسته)، `/plugins/{slug}/download/{grant}` (GET/HEAD).
پنل: `/admin/plugins`، `/admin/plugins/new`، `/admin/plugins/{id}`، `/admin/plugins/{id}/sources`، `/admin/plugins/{id}/preview`، `/admin/plugins/categories[/…]`، `/admin/plugins/blocks[/…]`، `/admin/plugins/monitor`، `/admin/plugins/users[/{id}]`، `/admin/plugins-export`.
داخلی: `POST /api/internal/revalidate`.

## آزمون‌ها (آخرین اجرای محلی)

| مجموعه | نتیجه |
| --- | --- |
| lint، typecheck، build (app + worker) | سبز |
| unit | ۶۳/۶۳ |
| integration (DB یک‌بارمصرف) | ۲۶/۲۶ |
| test:seo | ۱۶/۱۶ |
| test:security | ۸/۸ |
| test:e2e (شامل `plugins.test.mjs` با worker واقعی و منبع fixture) | ۴۲/۴۲ |
| test:db | ۴/۴ |
| shellcheck اسکریپت‌های deploy/ops، `docker compose config` | سبز |

جزئیات هر PL-T در `TEST-MATRIX.md`.

## منابع مصرفی و داده پایدار

- Worker: یک فرایند Node (حدود ۸۰–۱۵۰ مگابایت RAM در حالت عادی، سقف ۷۶۸)، هم‌زمانی ۲ کار؛ درخواست‌ها به هر میزبان حداقل ۱.۵ ثانیه فاصله.
- دیسک: حداکثر ۳ نسخه قابل دانلود برای هر افزونه + نسخه‌های منتظر بررسی + فایل‌های ردشده تا ۷ روز + موقت تا ۶ ساعت؛ زیر ۲ گیگ فضای آزاد، دانلود جدید متوقف.
- پشتیبان: dump دیتابیس (شامل همه جدول‌های افزونه) + `plugin-files-*.tar` روزانه (۳ نسخه).

## انتشار و راستی‌آزمایی

(این بخش پس از CI و استقرار به‌روز می‌شود.)
