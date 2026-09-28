# Performance Audit — seodaily.ir (Phase 05)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-05-perf` · پایه: `main` @ `dcdf33d`
>
> همه اندازه‌گیری‌ها روی **Build تولیدی** (standalone، همان ساختار ایمیج Docker) انجام شد، نه حالت توسعه. آزمون بار فقط محلی بود و **هیچ بار آزمایشی روی Production اجرا نشد**. عددها Lab هستند. داده میدانی (CrUX / Search Console) فقط از بیرون در دسترس است (بخش ۱۴).

## 1. Executive summary

- وضعیت پایه خوب بود:
  - Lighthouse موبایل: Performance ۹۱ تا ۹۵، SEO ۱۰۰، Best Practices ۱۰۰.
  - **CLS صفر** در همه صفحات (با وجود تغییر فونت به `swap` در فاز ۴).
  - JS فشرده ~۱۶۰KB، که بیشترش React/Next است.
  - صفحات عمومی با کش گرم **صفر کوئری دیتابیس** دارند.
- **یک مشکل معنادار (High)** پیدا و اصلاح شد: تصاویر بارگذاری‌شده بدون تغییر اندازه به مرورگر فرستاده می‌شدند. یک اسکرین‌شات ۲۴۰۰×۱۶۰۰ روی موبایل در `/portfolio` و صفحه اصلی **۴٫۱ مگابایت** دانلود داشت (در صفحه اصلی به‌عنوان تصویر LCP با اولویت بالا). اکنون با بهینه‌ساز Next.js نسخه WebP متناسب با عرض صفحه (**۴۴ تا ۵۲ کیلوبایت**) فرستاده می‌شود.
- بقیه موارد با شواهد بررسی شدند و تغییری لازم نداشتند (بخش ۳). طبق دستور فاز، بهینه‌سازی حدسی یا تغییر کلی استراتژی رندر انجام نشد.

## 2. Baseline and scope

### Lab — شرایط موبایل (۳۹۰px، DPR 2، CPU ×۴، ~۱٫۶Mbps، RTT ۱۵۰ms؛ Chromium واقعی)

| صفحه | FCP | LCP | CLS | TBT (long tasks) | JS | CSS | HTML | فونت | تصویر |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 1268ms | 1268ms | 0.000 | 396ms | 160KB | 20KB | 28KB | 78KB | 0 |
| `/web-design` | 1148ms | 1148ms | 0.000 | 303ms | 160KB | 20KB | 30KB | 78KB | 0 |
| `/seo` | 1152ms | 1152ms | 0.000 | 270ms | 160KB | 20KB | 29KB | 78KB | 0 |
| `/services/technical-seo` | 1320ms | 1320ms | 0.000 | 505ms | 160KB | 20KB | 38KB | 78KB | 0 |
| `/pricing` | 1244ms | 1244ms | 0.000 | 417ms | 169KB | 20KB | 22KB | 78KB | 0 |
| `/contact` | 1228ms | 1228ms | 0.000 | 471ms | 160KB | 20KB | 15KB | 78KB | 0 |

(حجم‌ها فشرده و روی شبکه است. «فونت» سه وزن وزیر است که از فاز ۴ همه Preload می‌شوند.)

### Lighthouse 12 موبایل (Simulated throttling)

| صفحه | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | SI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 95 | 100 | 100 | 100 | 0.9s | 2.8s | 120ms | 0 | 0.9s |
| `/services/technical-seo` | 91 | 100 | 100 | 100 | 1.0s | 2.9s | 240ms | 0 | 1.1s |
| `/pricing` | 94 | 96 | 100 | 100 | 0.9s | 3.0s | 70ms | 0 | 0.9s |

- LCP در Simulated mode متن Hero است (با انیمیشن ورود). اجرای دوم با **devtools throttling** روی صفحه اصلی: FCP = LCP = **2.1s**، با TTFB ۳۵ms. همان عدد فاز سئو است: پسرفتی نیست و انیمیشن LCP را از FCP عقب‌تر نمی‌برد.
- Accessibility ۹۶ در `/pricing` (کنتراست رنگ) به فاز ۹ ارجاع شد.

### سرور و دیتابیس

| بررسی | نتیجه |
| --- | --- |
| کوئری DB برای هر درخواست با کش گرم (`pg_stat_database.xact_commit` روی ۱۰ درخواست) | `/`، `/services/technical-seo`، `/pricing`، `/contact`، `/sitemap.xml`، `/robots.txt`: **۰** |
| TTFB محلی | ~۳۵ms |
| Cache-Control | HTML: `private, no-store` (رندر پویا). `/_next/static`، `/fonts`، `/uploads`: `public, max-age=31536000, immutable` |
| فشرده‌سازی | gzip توسط Next برای HTML و JS و CSS |
| HTTP/2 | `listen 443 ssl http2` در پیکربندی nginx |

### آزمون بار (فقط محلی، ۲۰ اتصال هم‌زمان، ۱۵ ثانیه برای هر مسیر)

| مسیر | درخواست در ثانیه | p50 | p95 | p99 | خطا |
| --- | --- | --- | --- | --- | --- |
| `/` | 53 | 360ms | 541ms | 667ms | 0 |
| `/services/technical-seo` | 48 | 413ms | 501ms | 566ms | 0 |
| `/pricing` | 74 | 267ms | 335ms | 387ms | 0 |
| `/sitemap.xml` | 504 | 35ms | 70ms | 95ms | 0 |
| `/api/health` | 632 | 30ms | 49ms | 60ms | 0 |

در طول آزمون اتصال‌های DB از سقف Pool (۱۰) بالاتر نرفت و `/api/health` بعد از آزمون ۲۰۰ بود. گلوگاه صفحات HTML رندر React روی یک پردازه Node است (~۲۰ms CPU برای هر صفحه)، نه دیتابیس. این ظرفیت برای یک سایت خدماتی کافی است. ادعایی درباره حداکثر ظرفیت Production نمی‌شود.

## 3. Confirmed findings

### Critical
هیچ.

### High

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| P-H1 | تصاویر بارگذاری‌شده: پورتفولیو، کارت پروژه، Hero صفحه اصلی و پورتفولیو، صفحه پروژه و خدمت، تیم | یک PNG ۲۴۰۰×۱۶۰۰ (۴٫۲MB) به‌عنوان تصویر پروژه، موبایل ۳۹۰px: `/portfolio` → **4108KB** `image/png`، `/` → **4108KB** (با `fetchPriority="high"`). آپلود تا ۵MB مجاز است | `<img src="/uploads/…">` فایل اصلی را بدون `srcset` یا تغییر اندازه می‌فرستاد | `next/image` با `fill`/`sizes` متناسب هر جایگاه. `images.localPatterns: /uploads/**` و `minimumCacheTTL` یک سال (نام فایل‌ها هرگز تکرار نمی‌شود). `sharp` از قبل در خروجی standalone هست، شامل باینری musl برای Alpine | بعد: `/portfolio` → **52KB** (دو WebP در ۶۴۰ و ۸۲۸px)، `/` → **44KB**. E2E ۴: صفحه خدمت تصویر را از `/_next/image?url=%2Fuploads…` می‌خواهد، فایل اصلی در HTML نیست و پاسخ `image/webp` است | ✅ |

### Medium / Low
هیچ مورد تازه. مورد مرتبط از فاز ۴: فونت با `optional` روی اتصال کند رسم نمی‌شد (U-H1، اصلاح‌شده). اینجا تأیید شد که `swap` همراه Preload هیچ Layout shiftی ایجاد نمی‌کند (CLS = 0 در همه صفحات، روی شبکه کند و CPU ×۴).

### بررسی‌شده، بدون تغییر (با دلیل)

| موضوع | یافته | تصمیم |
| --- | --- | --- |
| Server/Client Components | ۲۴ فایل `"use client"`. در سایت عمومی فقط ناوبری، Toast، فرم تماس، ماشین‌حساب و فیلتر پورتفولیو. بقیه در پنل | مناسب. کامپوننت سنگین غیرضروری سمت کلاینت نیست |
| JS | بزرگ‌ترین Chunkها React DOM (~۷۲KB gz) و Runtime Next (~۴۵KB gz). «Unused JS» در Lighthouse ~۲۹KB است که عمدتاً کد Framework است | کاهش معنادار بدون حذف قابلیت ممکن نیست |
| `force-dynamic` | HTML در هر درخواست رندر می‌شود، ولی داده از `unstable_cache` (تگ `content`) می‌آید و کوئری ندارد | تبدیل به رندر ایستا ظرفیت را بالا می‌برد، ولی Build را به دیتابیس وابسته می‌کند و خطر محتوای کهنه بعد از ویرایش پنل را دارد. با ترافیک فعلی سودش ثابت نشده و طبق دستور فاز انجام نشد |
| CSS | ۲۰KB فشرده، یک فایل. در Lighthouse ~۱۶۰ms Render-blocking | حجم کم است. تقسیم CSS پرریسک و کم‌سود است |
| انیمیشن‌ها | فقط transform/opacity. `prefers-reduced-motion` همه را خاموش می‌کند | مشکلی نیست |
| Compression/HTTP2/Immutable | بخش ۲ | مشکلی نیست. Brotli در nginx اختیاری است و ماژول آن روی سرور تأیید نشده |

## 4. Reproduction evidence

- **P-H1:**
  - تصویر آزمایشی با `sharp` ساخته شد (PNG ۴٬۲۰۵٬۵۷۵ بایت).
  - به‌عنوان پروژه منتشرشده در دیتابیس یک‌بارمصرف ثبت شد.
  - اسکریپت `img-weight.mjs` (Chromium، ۳۹۰px، DPR 2، پیمایش کامل صفحه) مجموع بایت‌های تصویر را از CDP شمرد:
    - قبل: `4108KB image/png` (هر دو صفحه).
    - بعد: `…&w=640&q=75: 8KB image/webp`، `…&w=828&q=75: 44KB image/webp`.
- **DB:** `select pg_stat_force_next_flush(); select xact_commit …` قبل و بعد از ۱۰ درخواست. اختلاف ۲ که همان دو کوئری اندازه‌گیری است.

## 5. Fixes implemented

1. بهینه‌سازی تصاویر بارگذاری‌شده با `next/image` در ۸ جایگاه، با `sizes` متناسب Layout.
2. نمایش TTFB هر صفحه در Smoke test بعد از Deploy (`ttfb=…s`) برای پایش پیوسته.

## 6. Files changed

- `next.config.ts` (`images`)
- `src/components/molecules/visual.tsx`، `src/components/molecules/project-card.tsx`
- `src/components/organisms/portfolio-grid.tsx`
- `src/components/organisms/sections/home/hero-visual.tsx`، `…/portfolio/hero-visual.tsx`، `…/project/hero-section.tsx`، `…/about/team-section.tsx`
- `tests/e2e/journeys.test.mjs` (تصویر بهینه‌شده)
- `.github/workflows/deploy.yml` (TTFB در Smoke test)

## 7. Tests added or updated

- E2E ۴ (خدمت): تصویر از بهینه‌ساز، نبود فایل اصلی در HTML، پاسخ `image/webp`.
- تست چیدمان فاز ۴ (فونت روی اتصال کند) و تست سئو ۱۲ (Preload فونت‌ها) همچنان پاسخ فونت را پوشش می‌دهند.

## 8. Regression results

روی Build تولیدی همین شاخه:

| بررسی | نتیجه |
| --- | --- |
| Lint / Typecheck / Build | ✅ |
| تست واحد | ✅ ۲۰/۲۰ |
| سئو | ✅ ۱۶/۱۶ |
| امنیت | ✅ ۹/۹ |
| E2E (سفرها و چیدمان) | ✅ ۱۹/۱۹ |
| CLS پس از تغییرات | ✅ ۰ |

## 9. Git branch and commit SHA(s)

- اصلاحات: شاخه `phase-05-perf`، آخرین Commit `e127adf`
- Merge در `main`: `29260eea8c420b7183a2b3e45a118465830c40a9`

## 10. PR

[irancss/seodaily#10](https://github.com/irancss/seodaily/pull/10) — Merge شد.

## 11. CI status

- PR #10 (اجرای `36465250430`): `check` ✅.
- `main` (اجرای `36466402470`): `check` ✅ · `deploy` ✅ · `verify` ✅.

## 12. Deployment status

✅ Deploy خودکار (Build image حدود ۱ دقیقه و ۳۶ ثانیه با کش لایه‌ها، ارسال Image به سرور ۲ دقیقه و ۸ ثانیه، راه‌اندازی ۹ ثانیه). گلوگاه زمان Deploy انتقال کامل Image از طریق SSH است. در فاز ۱۱ بررسی می‌شود.

## 13. Production verification

Smoke test در job `verify` (TTFB از Runner گیت‌هاب، یعنی خارج از ایران، شامل فاصله شبکه و TLS):

| صفحه | TTFB |
| --- | --- |
| `/` | 1.56s (اولین درخواست، چند ثانیه بعد از راه‌اندازی Container) |
| `/robots.txt`، `/sitemap.xml`، `/web-design`، `/seo`، `/services/technical-seo` | 1.26–1.38s |
| `/services`، `/services/seo-audit`، `/pricing`، `/about`، `/contact` | 0.70–0.76s |

- همه ۲۰۰، با یک H1 و Canonical درست.
- TTFB سمت سرور روی Build محلی حدود ۳۵ms است. پس بیشتر عدد بالا زمان رفت‌وبرگشت Runner تا سرور و گرم‌شدن اولیه است، نه رندر.
- عدد واقعی کاربر ایرانی از این Runner قابل اندازه‌گیری نیست. پیشنهاد: پایش از داخل ایران یا داده CrUX و Search Console، بعد از جمع‌شدن ترافیک.
- چیدمان Production ۸ عرض ✅. نسخه‌های دامنه ✅. سئو و امنیت ✅.

## 14. Remaining manual items

- **داده میدانی:** Core Web Vitals واقعی کاربران در Search Console → «Core Web Vitals» (یا PageSpeed Insights برای `https://seodaily.ir`) بعد از جمع‌شدن داده ۲۸ روزه. از این محیط در دسترس نیست.

## Checklist

- [x] Baseline Lab (۶ صفحه) و Lighthouse (۳ صفحه)
- [x] Query/Cache سرور، آزمون بار محلی
- [x] ۱ مورد High اصلاح شد (۴٫۱MB → ۴۴KB)
- [x] تست E2E تصویر
- [x] Regression کامل
- [ ] CI، Merge، Deploy و بررسی Production
