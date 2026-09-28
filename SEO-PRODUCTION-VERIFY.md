# SEO Production Verify — seodaily.ir (Phase 01)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-01-seo-closeout` · پایه: `main` @ `71a4f0c`
>
> این فاز بازنویسی سئو نیست. هدفش بستن کار قبلی است: بررسی اینکه اصلاحات `SEO-AUDIT.md` واقعاً در `main` هستند، Deploy شده‌اند و روی سایت واقعی درست کار می‌کنند.

## 1. Executive summary

- همه اصلاحات فاز سئو در `main` هستند. PR اصلی [#1](https://github.com/irancss/seodaily/pull/1) با Merge `9fe81b7` ادغام شده و گزارش آن در [#2](https://github.com/irancss/seodaily/pull/2) (`71a4f0c`) ادغام شده است. کار محلیِ Push‌نشده‌ای باقی نمانده است.
- Migration `0002_service_sections` غیرمخرب است. روی دیتابیس یک‌بارمصرف از هر دو مسیر (نصب تازه و ارتقای نسخه قدیم) تست شد و روی Production هم اعمال شده است.
- هیچ باگ سئو در کد پیدا نشد. مشکلات این فاز همه **فاصله در پوشش تست و بررسی Production** بود:
  - تست‌ها فقط ۹ صفحه مهم را کامل می‌سنجیدند و بقیه صفحات خدمات را فقط از نظر ۲۰۰ و Canonical بررسی می‌کردند.
  - لینک‌های داخلی، متن Placeholder، نوع Schema هر صفحه و `font-display` تست خودکار نداشتند.
  - بررسی ریدایرکت دامنه در CI فقط گزارشی بود و در صورت خرابی شکست نمی‌خورد.
- این فاصله‌ها بسته شدند. تست‌های سئو از ۹ به ۱۶ رسید و بعد از هر Deploy روی خود Production اجرا می‌شود. بررسی دامنه اکنون سخت‌گیرانه است (یک 301 مستقیم، بدون زنجیره). جدول Crawl همه صفحات در Summary هر اجرای CI ثبت می‌شود.

## 2. Baseline and scope

| مورد | وضعیت در شروع فاز |
| --- | --- |
| `main` | `71a4f0c` (شامل #1 و #2) |
| شاخه‌های remote | `main`، `seo-audit` (ادغام‌شده در #1) |
| PR باز | ندارد |
| کامیت محلی Push‌نشده | ندارد (`git status` تمیز) |
| دسترسی مستقیم به `seodaily.ir` از این محیط | ندارد (سیاست شبکه). بررسی Production از Runner گیت‌هاب در job `verify` انجام می‌شود |
| Search Console | دسترسی ندارم (بخش ۱۴) |

محدوده: همه موارد فایل فاز ۱ — تطبیق Repository، رفتار سئو در کد، ایمنی Migration، Push/Merge، Crawl سایت واقعی، نسخه‌های دامنه و اجرای تست‌های سئو روی Production.

### رفتار سئو در کد فعلی (`71a4f0c`)

| مورد | محل | نتیجه |
| --- | --- | --- |
| `robots.txt` | `src/app/robots.ts` | ✅ فقط `/admin` بسته؛ `Sitemap` مطلق؛ بدون `Host` |
| `sitemap.xml` پویا | `src/app/sitemap.ts` | ✅ ۲۱ آدرس (۷ صفحه + ۱۴ خدمت)؛ `/portfolio` فقط وقتی نمونه‌کار منتشرشده باشد؛ `lastModified` از `updatedAt`؛ بدون changefreq/priority |
| Canonical | `src/modules/seo/metadata.ts` | ✅ مطلق، خودارجاع، صفحه اصلی = `https://seodaily.ir` |
| noindex | admin (هدر `X-Robots-Tag` + متا)، 404، پورتفولیوی خالی | ✅ |
| متادیتا و یک H1 | همه ۲۱ صفحه Sitemap | ✅ عنوان و توضیح یکتا، دقیقاً یک H1 |
| Structured data | Organization + WebSite همه‌جا؛ BreadcrumbList صفحات داخلی؛ Service صفحات خدمت؛ FAQPage جایی که FAQ هست | ✅ بدون Review/Rating/LocalBusiness |
| محتوای بلند خدمات | `overview` + `sections` | ✅ هر ۱۴ خدمت: ۱۷۹۶ تا ۲۳۰۳ کلمه، ۳ تا ۵ بخش عمیق، ۲ تا ۴ لینک درون‌متنی |
| `lang="fa"` و `dir="rtl"` | `src/app/layout.tsx` | ✅ |
| دامنه | `deploy/nginx-seodaily.ir.conf`، `deploy/apache-seodaily.ir.conf` | ✅ یک 301 به `https://seodaily.ir` |
| فونت | `src/app/globals.css` | ✅ `font-display: optional` در هر دو `@font-face` |

## 3. Confirmed findings

### Critical
هیچ.

### High
هیچ.

### Medium

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| P1-M1 | `.github/workflows/deploy.yml` (job `verify`) | مرحله «Domain variants (informational…)» فقط `curl` را چاپ می‌کرد و در هر حالت موفق می‌شد | بررسی در زمانی نوشته شد که تنظیم سرور هنوز معلوم نبود | مرحله سخت‌گیرانه شد: سه نسخه `http://`، `http://www.`، `https://www.` برای `/` و `/seo` باید **دقیقاً یک 301** به همان مسیر روی `https://seodaily.ir` بدهند و مقصد ۲۰۰ باشد | همین مرحله در `verify` | ✅ |

### Low

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| P1-L1 | `tests/seo.test.mjs` | عنوان/توضیح/H1/lang فقط برای ۹ صفحه تست می‌شد؛ ۱۲ صفحه خدمت دیگر فقط ۲۰۰ + Canonical | پوشش محدود | تست «every sitemap page» روی همه آدرس‌های Sitemap: طول عنوان ۱۰–۷۰، توضیح ۵۰–۲۰۰، یک H1، `fa`/`rtl`، یکتایی عنوان و توضیح | تست ۶ | ✅ |
| P1-L2 | `tests/seo.test.mjs` | نوع Schema هر صفحه تست نمی‌شد | پوشش محدود | Organization+WebSite همه‌جا، BreadcrumbList در صفحات داخلی، Service در `/services/*`، بدون Review/AggregateRating/LocalBusiness | تست ۷ | ✅ |
| P1-L3 | `tests/seo.test.mjs` | محتوای بلند و لینک درون‌متنی خدمات تست نداشت؛ با ویرایش پنل ممکن است بی‌صدا حذف شود | پوشش محدود | هر صفحه خدمت: بخش `service-overview`، حداقل ۳ بخش `service-topic-*`، حداقل ۸۰۰ کلمه، حداقل یک لینک داخلی درون مقاله | تست ۸ | ✅ |
| P1-L4 | `tests/seo.test.mjs` | لینک‌های داخلی بررسی نمی‌شدند | پوشش محدود | همه لینک‌های داخلی یکتای همه صفحات Sitemap (۲۲ مقصد) باید مستقیم ۲۰۰ بدهند (نه 404، نه ریدایرکت) | تست ۹ | ✅ |
| P1-L5 | `tests/seo.test.mjs` | متن Placeholder یا خطای قالب (`undefined`، `NaN`، `lorem`، `[object Object]`، `{{`) بررسی نمی‌شد | پوشش محدود | بررسی متن قابل‌مشاهده همه صفحات + `/portfolio` | تست ۱۰ | ✅ |
| P1-L6 | `tests/seo.test.mjs` | سازگاری پورتفولیو با Sitemap و `font-display` تست نداشت | پوشش محدود | پورتفولیو یا در Sitemap و indexable، یا خارج از آن و noindex؛ همه `@font-face`ها در CSS تولیدی `font-display:optional` | تست‌های ۱۱ و ۱۲ | ✅ |
| P1-L7 | CI | نتیجه Crawl صفحه‌به‌صفحه جایی ثبت نمی‌شد | — | `tests/seo-report.mjs`: جدول Markdown (وضعیت، Canonical، robots، H1، عنوان، طول توضیح، نوع JSON-LD) برای همه صفحات + پورتفولیو + یک 404، در Summary جاب‌های `check` و `verify` | خروجی CI | ✅ |

## 4. Reproduction evidence

- **پوشش قبلی:** `tests/seo.test.mjs` در `71a4f0c` نه تست داشت. آدرس‌های Sitemap فقط در تست ۳ (۲۰۰، indexable، Canonical) بررسی می‌شدند.
- **بررسی دامنه:** در اجرای `36454881646`، مرحله Domain variants با عنوان «informational» و بدون `exit` غیرصفر بود.
- **Crawl محلی** (Build تولیدی + دیتابیس تازه Seed‌شده + `SITE_URL=https://seodaily.ir`):
  - ۲۱ آدرس Sitemap همه ۲۰۰ و indexable با Canonical خودارجاع.
  - ۲۲ مقصد لینک داخلی، همه ۲۰۰.
  - لینک درون‌متنی خدمات: ۲ تا ۴ در هر صفحه.
  - `/portfolio` بدون نمونه‌کار: `noindex, follow` و خارج از Sitemap.

## 5. Fixes implemented

1. گسترش تست‌های سئو از ۹ به ۱۶ (P1-L1 تا P1-L6). هر صفحه یک‌بار دریافت و در همه تست‌ها استفاده می‌شود (بدون بار اضافه روی Production).
2. سخت‌گیرانه‌کردن بررسی نسخه‌های دامنه در `verify` (P1-M1).
3. گزارش Crawl در Summary جاب‌ها (P1-L7).

در کد برنامه تغییری لازم نبود.

## 6. Files changed

- `tests/seo.test.mjs` — ۷ تست جدید و کش صفحه در طول اجرا.
- `tests/seo-report.mjs` — جدید؛ گزارش Crawl.
- `.github/workflows/deploy.yml` — گزارش در `check`؛ بررسی سخت‌گیرانه دامنه و گزارش در `verify`.
- `SEO-PRODUCTION-VERIFY.md` — همین گزارش.

## 7. Tests added or updated

| # | تست | محیط |
| --- | --- | --- |
| 6 | every sitemap page: title, description, one H1, lang/dir, unique | CI (محلی) + Production |
| 7 | structured data types match the page | CI + Production |
| 8 | service pages carry long-form content with contextual internal links | CI + Production |
| 9 | internal links on public pages resolve | CI + Production |
| 10 | no placeholder or broken template text | CI + Production |
| 11 | portfolio listed+indexable or unlisted+noindex | CI + Production |
| 12 | fonts use font-display: optional | CI + Production |
| — | Domain variants: یک 301 به میزبان اصلی | Production (`verify`) |

### ایمنی Migration (دیتابیس یک‌بارمصرف)

| سناریو | نتیجه |
| --- | --- |
| نصب تازه (`migrate` + `seed`) | ✅ `seeded 14 services`؛ محتوای v2 مستقیم؛ نسخه ثبت شد |
| اجرای دوم روی همان دیتابیس | ✅ بدون تغییر (بدون Seed یا ارتقای تکراری) |
| ارتقای نسخه قدیم (`90e6cfb`) با یک خدمت ویرایش‌شده در پنل | ✅ `service content v2: updated 13, kept (edited or missing): seo-audit`. ردیف ویرایش‌شده دست نخورد (`overview`=''، `sections`=[]). بقیه محتوای کامل گرفتند |
| اجرای دوم بعد از ارتقا | ✅ ارتقا تکرار نشد |
| SQL `0002` | ✅ فقط `ADD COLUMN ... DEFAULT ... NOT NULL` (بدون DROP/ALTER TYPE/حذف داده) |
| ترتیب در Production | کانتینر هنگام شروع: `migrate` → `seed` → سرور. `healthy` فقط بعد از این دو |

## 8. Regression results

روی Build تولیدی و دیتابیس تازه:

| بررسی | نتیجه |
| --- | --- |
| تست‌های سئو | ✅ ۱۶/۱۶ |
| ESLint روی `tests/` | ✅ |
| YAML ورک‌فلو | ✅ معتبر |
| Lint/Typecheck/Build/SEO در CI | بخش ۱۱ |

## 9. Git branch and commit SHA(s)

- شاخه: `phase-01-seo-closeout`
- کامیت‌ها و Merge: بخش ۱۳ (بعد از Merge به‌روزرسانی می‌شود).

## 10. PR

بخش ۱۳.

## 11. CI status

بخش ۱۳.

## 12. Deployment status

بخش ۱۳.

## 13. Production verification

وضعیت قبل از این فاز (اجرای `36454881646` روی `9fe81b7`):
- Smoke test ۱۱ مسیر: همه ۲۰۰، یک H1، Canonical درست، indexable.
- `http://seodaily.ir/seo`، `http://www.seodaily.ir/seo`، `https://www.seodaily.ir/seo` → `301 https://seodaily.ir/seo`.
- تست‌های سئو روی Production: ۹/۹.

نتیجه بعد از Merge این فاز در ادامه ثبت می‌شود.

## 14. Remaining manual items

فقط از طریق Google Search Console ممکن است و از اینجا دسترسی ندارم. وضعیتی جعل نشده است:

1. ارسال `https://seodaily.ir/sitemap.xml` در بخش Sitemaps.
2. URL Inspection و «Request indexing» برای `/`، `/web-design`، `/seo`، `/services` و چند صفحه خدمت.
3. پایش گزارش Page indexing (به‌ویژه «Duplicate without user-selected canonical» و «Crawled – currently not indexed») در ۲ تا ۴ هفته آینده.
4. Core Web Vitals (داده میدانی) بعد از جمع‌شدن داده کافی.
5. Rich Results Test برای یک صفحه خدمت (Service/Breadcrumb/FAQ).

بقیه موارد دستی قبلی (OG Image، Privacy Policy، اطلاعات اعتماد واقعی) در بخش ۱۷ `SEO-AUDIT.md` هستند و به محتوای واقعی کسب‌وکار نیاز دارند.

## Checklist

- [x] اصلاحات سئو در `main` (#1، #2)
- [x] Migration غیرمخرب و تست‌شده روی دیتابیس یک‌بارمصرف
- [x] تست‌های سئو ۱۶/۱۶ (محلی)
- [ ] CI این فاز
- [ ] Merge و Deploy
- [ ] Production: Crawl، دامنه‌ها، ۱۶ تست
