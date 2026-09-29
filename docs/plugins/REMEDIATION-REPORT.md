# Plugin library corrections — 2026-09-29

Scope: the supplied WordPress plugins implementation specification and its
integration with the site's existing template. The preceding twelve phases are
the baseline; no general redesign or dependency upgrade is included.

## تطبیق نهایی باگ‌ها با کد و تست

هر ردیف زیر در کد اعمال شده است؛ «نیازمند استقرار» به معنی باقی‌ماندن اصلاح
کد نیست. این شاخه هنوز روی سایت اصلی مستقر نشده است. وضعیت جاری CI و commit
در [PR شمارهٔ ۲۱](https://github.com/irancss/seodaily/pull/21) ثبت می‌شود.

| باگ یا نقص گزارش‌شده | محل اصلاح | شاهد بررسی | وضعیت |
| --- | --- | --- | --- |
| تغییر صفحه عمومی با ذخیره پیش‌نویس | `catalog.ts`، `draft.ts`، `slugs/registry.ts` | `plugin-drafts.test.mjs`: عنوان، SEO، دسته، تصویر، آدرس، revision و انتشار اتمیک | اعمال شده |
| افزایش آمار با suffix/Range ناقص یا تکراری | `downloads/grants.ts`، `ranges.ts`، route دانلود | unit بازه‌ها، integration هم‌زمانی و E2E prefix + suffix | اعمال شده |
| معتبرماندن مجوز قبلی بعد از بستن دانلود | `downloads/grants.ts` | integration رد HEAD و GET مجوز قبلی | اعمال شده |
| ندیدن تغییر ZIP با نسخه یکسان | `pipeline/check.ts` | integration تعویض فایل همان منبع؛ بدون انتشار خودکار | اعمال شده |
| بررسی‌نشدن دوباره نسخه منتظر پس از بازیابی سرویس‌ها | `pipeline/check.ts` | integration بررسی دوباره همان SHA و انتشار پس از PASS | اعمال شده |
| یکسان دانستن نبود مرجع checksum و خرابی دریافت آن | `check.ts`، `releases.ts` | integration مرجع غایب، خطای دریافت و فایل اضافه | اعمال شده |
| اجرای PHP بدون اسکن موفق یا پذیرش fatal | `check.ts`، `releases.ts`، `sandbox.ts` | integration gate اجرا، unit پروتکل runner و نمونه fatal واقعی | اعمال شده |
| نبود سرویس اسکنر و healthcheck نامناسب worker | Compose محلی/تولید، `ship.sh`، `worker-health.mjs`، پایش | ClamAV واقعی: فایل سالم PASS، EICAR رد؛ ShellCheck و CI | کد اعمال شده؛ استقرار لازم |
| runner صرفاً interface بود | `deploy/sandbox/`، `pipeline/sandbox.ts` | پروتکل، فرمان‌های جداسازی و پاک‌سازی؛ نصب/فعال‌سازی دو نمونه محلی | کد و بسته آماده؛ VM و آزمون gVisor باقی است |
| آیکن رسمی فقط به‌عنوان یادداشت ثبت می‌شد | `pipeline/check.ts` | integration ذخیره تصویر معتبر محلی و حفظ override مدیر | اعمال شده |
| نقص canonical/noindex دسته و sitemap | فرم/اکشن دسته، schema، metadata، `plugins/seo.ts`، sitemap | unit دامنه خارجی و نامک فارسی؛ E2E sitemap واقعی | اعمال شده؛ شامل تکمیل بررسی دوم |
| انباشت فایل‌های منتظر بررسی | `maintenance.ts`، `check.ts`، migration ۰۰۰۵ | integration انقضا، حفظ تاریخچه و دریافت دوباره همان SHA | اعمال شده |
| بازیابی DB بدون تطبیق بایت‌های فایل | `deploy/ops/`، `verify-plugin-files.mjs` | unit فقدان/خرابی فایل و SHA؛ ShellCheck | کد اعمال شده؛ بازیابی production اجرا نشده |
| عدم پیروی صفحات افزونه از قالب | `plugin-page-view.tsx`، `FaqList`، تب‌های پنل و `PluginIcon` | مشاهده دسکتاپ/موبایل؛ E2E عرض ۳۲۰/۷۶۸/۱۴۴۰ و دسترس‌پذیری | اعمال شده |

در بررسی دوم مشخص شد مقایسهٔ canonical افزونه فقط انتهای مسیر را بررسی می‌کرد.
اکنون افزونه و دسته هر دو URL کامل را نسبت به دامنهٔ تنظیم‌شده مقایسه می‌کنند؛
دامنهٔ خارجی با همان مسیر وارد sitemap نمی‌شود و نامک فارسی در حالت Unicode
و URL-encoded به‌درستی شناسایی می‌شود. تست‌ها برای سبزشدن حذف یا skip نشده‌اند.

## Implemented

- Editorial snapshots now isolate title, slug, categories, media and SEO until
  publication. Draft slugs are reserved without redirecting live addresses.
  Publication checks the editor revision and commits the snapshot atomically.
- Completed byte ranges are merged under a grant row lock. A suffix request,
  overlapping retries, or HEAD cannot inflate the download count. Disabling
  downloads also refuses existing grants.
- Repeated source checks compare ZIP hashes even without a version change.
  Pending checks are rerun after scanner/runner recovery, without duplicate
  releases. Replacement bytes at the same version always require review.
- Missing official checksum references remain informational; transport/format
  failures for an existing reference block automatic publication. Missing,
  different or extra referenced files cannot pass. The auto-publication gate is
  also enforced inside the publication transaction.
- PHP execution requires passing archive validation and a complete malware
  scan. Fatal sandbox results cannot be manually approved as clean.
- Compose includes an internal ClamAV service with persistent definitions and
  explicit scan limits. The deploy transport ships the scanner image. Worker
  health uses its own fresh database-backed heartbeat, and stale monitor reports
  are displayed as unknown.
- The authenticated remote runner client and separate-VM setup package are in
  `deploy/sandbox/`. The orchestrator requires gVisor and creates disposable,
  networkless WordPress/MariaDB environments. Production never falls back to
  executing PHP on the website host.
- Official icons are fetched with the existing SSRF/size protections and saved
  through the existing image validator. Manual icons are preserved. Categories
  have independent canonical/noindex controls reflected in metadata and sitemap.
- Review storage expires after 30 days by default. Checks and history remain;
  a later check can reacquire and verify the same artifact. Current/downloadable
  and shared files retain the existing protection.
- Daily backup pauses package cleanup. Restore stops both app and worker.
  Restore checks extract into a disposable volume and compare retained files
  with database sizes and SHA-256 values before reporting success.
- Plugin headers reuse `PageHero`, headings use the template scale, rich FAQs
  reuse `FaqList`, and admin navigation uses the existing pill style with the
  correct active section. Decorative icon letters are excluded from H1 text.

## Validation

Executed in an isolated Linux Docker environment and disposable PostgreSQL 16
databases; the existing local database/containers were not modified:

| Check | Result |
| --- | --- |
| TypeScript, ESLint, POSIX shellcheck | Pass |
| Production app and worker build | Pass; dynamic filesystem tracing warning removed |
| Unit tests | 69 pass after the second review (67 before the canonical regressions) |
| Integration tests | 34 pass |
| Migration/seed tests | 4 pass |
| SEO | 16 pass |
| HTTP/security | 9 pass |
| Plugin browser journeys | 5 pass, including suffix Range regression and 320/768/1440 layout |
| Full local browser suite | 34/42; eight existing admin journeys fail immediate post-save observations |
| Real ClamAV 1.4.6 | Healthy, clean fixture PASS, standard EICAR fixture FAIL |

The original `f27b0f762164` was built separately: its unchanged GTM journey also
failed locally (18/19 baseline journeys passed). The final server's wall and
monotonic clocks were measured about 34 ms apart; the installed Next.js cache
uses both clocks for expiration. This is evidence for a local timing problem,
not a claim that all eight failures were independently reproduced on baseline.
The independent GitHub Actions result is recorded on the pull request.

For the implementation commit `86f3a45`, [GitHub Actions completed successfully](https://github.com/irancss/seodaily/actions/runs/36514220676),
including the complete SEO/security/E2E and migration step. The local failures
above remain distinct from this successful independent run. The second review
adds two unit cases and one E2E case for canonical/noindex sitemap behavior;
the final commit's check result is recorded on PR #21.

Desktop/mobile screenshots of actual rendered fixture pages were inspected;
no new fonts, design libraries or npm packages were introduced.

## Deployment boundary

The separate VM does not exist yet, as confirmed by the owner. Runner protocol,
failure handling and isolation command construction are tested; actual gVisor
deployment, hostile-code containment, dependency profiles and real WordPress
activation on that VM remain deployment checks. Its setup README gives the
required acceptance sequence. Automatic publication must remain closed until
the runner is configured and those checks pass.

The real runner commands were also exercised with two locally authored fixtures
under ordinary local Docker: a benign plugin installed, activated and responded
successfully; a deliberate PHP fatal was rejected. Both jobs removed their
containers and socket volumes. Only these trusted test fixtures used that
functional harness; production code always requires runsc. This does not prove
gVisor containment or readiness of the future VM.

This branch adds migration `0005_plugin_readiness`. Production deployment,
production restore and real SMS delivery are not claimed by this report.
