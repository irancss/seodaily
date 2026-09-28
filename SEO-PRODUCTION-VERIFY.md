# SEO Production Verify — seodaily.ir (Phase 01)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-01-seo-closeout` → [PR #3](https://github.com/irancss/seodaily/pull/3) · Merge: `5ca68b1` · Deploy و تأیید Production: ✅
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
| P1-L8 | CI (job `check`) | اولین اجرای CI روی PR #3: تست `font-display` شکست خورد (`the site font is declared`)، چون سرور standalone در CI بدون `.next/static` اجرا می‌شد و CSS پاسخ 404 می‌داد؛ در Docker این فایل‌ها کپی می‌شوند | CI با ایمیج Production یکسان نبود و تست‌های مربوط به CSS/فونت واقعیت را نمی‌دیدند | کپی `.next/static` و `public` کنار سرور standalone، مثل Dockerfile (`3a2afcc`)؛ تست حالا وضعیت ۲۰۰ فایل CSS را هم بررسی می‌کند | تست ۱۲ | ✅ |

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

| بررسی | محلی (Build تولیدی، دیتابیس تازه) | CI روی PR #3 (`3a2afcc`) |
| --- | --- | --- |
| Lint / Typecheck / Build | ✅ | ✅ |
| تست‌های سئو | ✅ ۱۶/۱۶ | ✅ ۱۶/۱۶ |
| YAML ورک‌فلو | ✅ | ✅ |

## 9. Git branch and commit SHA(s)

| مورد | SHA |
| --- | --- |
| تست‌ها، گزارش Crawl، بررسی سخت‌گیرانه دامنه | `63ddf5b` |
| اصلاح CI (فایل‌های static) | `3a2afcc` |
| Merge در `main` | `5ca68b14581a6e127b8d87faae0bca8b0dd8890a` |

## 10. PR

[irancss/seodaily#3](https://github.com/irancss/seodaily/pull/3) — «Phase 01: SEO production closeout and verification» (Merge شد).

## 11. CI status

- PR #3: اجرای اول ❌ (P1-L8)، اجرای دوم `36456778021` ✅.
- `main` بعد از Merge: اجرای `36457079402` — `check` ✅ · `deploy` ✅ · `verify` ✅.

## 12. Deployment status

✅ Deploy خودکار روی سرور (job `deploy`، اجرای `36457079402`): ساخت ایمیج، انتقال با SSH، `docker compose up`، سلامت کانتینر. Migration جدیدی در این فاز نبود.

## 13. Production verification

از Runner گیت‌هاب روی `https://seodaily.ir` (job `verify`، اجرای `36457079402`):

**نسخه‌های دامنه (سخت‌گیرانه):**

| از | نتیجه |
| --- | --- |
| `http://seodaily.ir/` | 301 → `https://seodaily.ir/` → 200 |
| `http://www.seodaily.ir/` | 301 → `https://seodaily.ir/` → 200 |
| `https://www.seodaily.ir/` | 301 → `https://seodaily.ir/` → 200 |
| `http://seodaily.ir/seo` | 301 → `https://seodaily.ir/seo` → 200 |
| `http://www.seodaily.ir/seo` | 301 → `https://seodaily.ir/seo` → 200 |
| `https://www.seodaily.ir/seo` | 301 → `https://seodaily.ir/seo` → 200 |

**Crawl کامل Production** (خروجی `tests/seo-report.mjs`):

| مسیر | وضعیت | Canonical | Robots | H1 | طول توضیح | JSON-LD |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | `https://seodaily.ir` | index | 1 | 152 | FAQPage, Organization, WebSite |
| `/web-design` | 200 | خودارجاع | index | 1 | 141 | FAQPage, Service, BreadcrumbList, Organization, WebSite |
| `/seo` | 200 | خودارجاع | index | 1 | 137 | FAQPage, Service, BreadcrumbList, Organization, WebSite |
| `/services` | 200 | خودارجاع | index | 1 | 145 | FAQPage, BreadcrumbList, Organization, WebSite |
| `/pricing` | 200 | خودارجاع | index | 1 | 127 | BreadcrumbList, Organization, WebSite |
| `/about` | 200 | خودارجاع | index | 1 | 127 | AboutPage, BreadcrumbList, Organization, WebSite |
| `/contact` | 200 | خودارجاع | index | 1 | 125 | ContactPage, BreadcrumbList, Organization, WebSite |
| ۱۴ صفحه `/services/*` | همه 200 | خودارجاع | index | 1 | ۱۳۰–۱۴۸ | FAQPage, Service, BreadcrumbList, Organization, WebSite |
| `/portfolio` | 200 | خودارجاع | noindex, follow | 1 | 111 | BreadcrumbList, Organization, WebSite |
| مسیر ناموجود | **404** | — | noindex | 0 | — | — |

**تست‌های سئو روی Production:** ✅ **۱۶/۱۶**. شامل همه صفحات Sitemap، لینک‌های داخلی (همه ۲۰۰)، نبود Placeholder، محتوای بلند خدمات، `font-display: optional` در CSS واقعی، 404 واقعی، ریدایرکت Slash انتهایی و noindex پنل مدیریت.

## 14. Remaining manual items

فقط از طریق Google Search Console ممکن است و از اینجا دسترسی ندارم. وضعیتی جعل نشده است:

1. ارسال `https://seodaily.ir/sitemap.xml` در بخش Sitemaps.
2. URL Inspection و «Request indexing» برای `/`، `/web-design`، `/seo`، `/services` و چند صفحه خدمت.
3. پایش گزارش Page indexing (به‌ویژه «Duplicate without user-selected canonical» و «Crawled – currently not indexed») در ۲ تا ۴ هفته آینده.
4. Core Web Vitals (داده میدانی) بعد از جمع‌شدن داده کافی.
5. Rich Results Test برای یک صفحه خدمت (Service/Breadcrumb/FAQ).

بقیه موارد دستی قبلی (OG Image، Privacy Policy، اطلاعات اعتماد واقعی) در بخش ۱۷ `SEO-AUDIT.md` هستند و به محتوای واقعی کسب‌وکار نیاز دارند.

## Checklist

- [x] اصلاحات سئو در `main` (#1، #2، #3)
- [x] Migration غیرمخرب و تست‌شده روی دیتابیس یک‌بارمصرف
- [x] Lint / Typecheck / Build
- [x] تست‌های سئو ۱۶/۱۶ (محلی، CI و **Production**)
- [x] Merge (`5ca68b1`) و Deploy خودکار
- [x] نسخه‌های دامنه: ۶/۶ با یک 301 مستقیم
- [x] Crawl کامل Production: ۲۱ صفحه ۲۰۰ و indexable، پورتفولیو noindex، 404 واقعی
- [ ] Search Console — فقط دستی (بخش ۱۴)
