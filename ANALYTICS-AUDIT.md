# Analytics & Conversion Audit — seodaily.ir (Phase 10)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-10-analytics`
>
> هیچ شناسه‌ای (GA4، GTM، Ads) ساخته یا حدس زده نشد. کد فقط رویدادها را در `window.dataLayer` می‌گذارد. تا وقتی شناسه GTM در پنل وارد نشود، هیچ اسکریپت یا درخواستی به Google نمی‌رود.

## 1. Executive summary

- **وضعیت قبل:** سایت هیچ ابزار اندازه‌گیری نداشت: نه GA4، نه GTM، نه `dataLayer`، نه Ads. تنها مورد، پشتیبانی از کد تأیید Search Console در پنل بود. یعنی هیچ تماس، فرم یا برآوردی قابل اندازه‌گیری نبود.
- **اکنون:**
  - یک لایه رویداد متمرکز (`src/lib/analytics.ts`) با ۵ رویداد و Schema ثابت. فقط کلیدهای مجاز و مقدارهای کوتاه (حروف لاتین، عدد، `-` و `_`) عبور می‌کنند، پس **داده شخصی از نظر فنی نمی‌تواند وارد شود**.
  - تبدیل واقعی (`generate_lead`) فقط وقتی ثبت می‌شود که **سرور ردیف جدیدی ذخیره کرده باشد**. خطای اعتبارسنجی، ارسال تکراری، Honeypot ربات و خطای دیتابیس هیچ‌کدام تبدیل حساب نمی‌شوند.
  - GTM اختیاری در پنل (تنظیمات → عمومی): فقط با قالب دقیق `GTM-…`، حداکثر یک بار، فقط در سایت عمومی (نه پنل). CSP برای میزبان‌های لازم GTM و GA4 به‌روز شد.
  - ۶ تست واحد، ۴ تست مرورگر فقط‌خواندنی (در CI و روی Production بعد از هر Deploy) و ۳ سفر کاربر با بررسی `dataLayer`.

## 2. Baseline and scope

### Inventory (کد قبل از این فاز)

| مورد | وضعیت | شواهد |
| --- | --- | --- |
| GA4 / gtag | ندارد | `grep -ri "gtag\|G-[A-Z0-9]\|google-analytics" src` → هیچ |
| Google Tag Manager | ندارد | `grep -ri "googletagmanager\|GTM-" src` → هیچ |
| `dataLayer` | ندارد | `grep -r dataLayer src` → هیچ |
| Ads / Pixel | ندارد | هیچ اسکریپت شخص ثالث. CSP قبلی فقط `'self'` اجازه می‌داد |
| Search Console | ✅ پشتیبانی در کد | فیلد `googleVerification` در پنل → `<meta name="google-site-verification">` در `(site)/layout.tsx` |
| Consent | ندارد | نیازی هم نبود، چون چیزی ردیابی نمی‌شد |
| متغیر محیطی Analytics | ندارد | `.env.example` و `check-env.ts` |
| لینک WhatsApp/Telegram | ندارد | در کد نیست و «شبکه‌های اجتماعی» در تنظیمات پیش‌فرض خالی است (`socials: []`). پس رویدادی برایشان تعریف نشد. اگر بعداً از پنل اضافه شوند، افزودن رویداد در همان Listener یک شرط است |

### Measurement plan

| رویداد | دسته | کی | پارامترها |
| --- | --- | --- | --- |
| `phone_click` | Lead intent | کلیک روی هر لینک `tel:` | `placement`: `header` · `menu` · `hero` · `content` · `cta` · `footer` · `floating` |
| `cta_click` | Lead intent | کلیک روی لینک به `/contact` یا `/pricing` از صفحه‌ای دیگر | `placement`، `target`: `contact` · `pricing` |
| `form_start` | Engagement | اولین تایپ یا انتخاب در فرم تماس یا فرم برآورد، یک بار در هر بازدید صفحه | `form`: `contact` · `estimate` |
| `pricing_start` | Engagement | اولین انتخاب در ماشین‌حساب هر خدمت (گزینه یا پلن)، یک بار برای هر خدمت در هر بازدید | `service` (مثل `web-design`) |
| `generate_lead` | **Conversion** | سرور درخواست جدید را ذخیره کرد | `form`، `service`، و برای برآورد `estimate_total_toman` (مبلغ محاسبه‌شده سرور) |

- `generate_lead` نام رویداد پیشنهادی GA4 برای سرنخ است. در GA4 باید به‌عنوان **Key event** علامت بخورد. کلیک‌ها سرنخ یا فروش نیستند و نباید Key event شوند.
- «برآورد تولیدشده» جدا ثبت نشد: جمع برآورد با هر انتخاب زنده عوض می‌شود و یک لحظه مشخص «تکمیل» ندارد. قیف ماشین‌حساب با `pricing_start` (شروع)، `form_start` با `form=estimate` (قصد ارسال) و `generate_lead` با `form=estimate` (ثبت) کامل می‌شود.
- بازدید صفحه‌های نمونه‌کار ردیابی جدا ندارد، چون Pageview همان را نشان می‌دهد و Production فعلاً نمونه‌کاری ندارد.

## 3. Confirmed findings

### High

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| AN-H1 | کل سایت | Inventory بالا: هیچ رویدادی برای تماس، فرم یا برآورد وجود نداشت. بعد از نصب هر ابزار، تبدیل‌ها باز هم دیده نمی‌شدند | اندازه‌گیری هرگز پیاده نشده بود | `lib/analytics.ts` (Schema، پاک‌سازی، `track`، `trackOnce`)، `AnalyticsListener` (یک Listener سراسری برای `tel:` و CTAها)، `form_start` و `pricing_start` در فرم‌ها، `generate_lead` بعد از تأیید سرور | واحد و E2E (بخش ۷) | ✅ |
| AN-H2 | اکشن‌های `submitConsultation` و `submitEstimate` | پاسخ موفق برای **سه حالت متفاوت یکسان بود**: ذخیره واقعی، درخواست تکراری در ۱۰ دقیقه (فاز ۳)، و Honeypot ربات. کلاینت نمی‌توانست تبدیل واقعی را تشخیص دهد و هر کدی که روی `status === "success"` رویداد بفرستد، تکرار و ربات را هم می‌شمرد | نیاز اندازه‌گیری در طراحی State لحاظ نشده بود | فیلد `lead` فقط بعد از `insert` موفق. کلاینت فقط با آن `generate_lead` می‌فرستد، یک بار برای هر پاسخ سرور (`trackOnce` روی همان شیء State) | E2E: خطای اعتبارسنجی → ۰، ثبت → ۱، ارسال دوباره همان درخواست → ۰، Back بعد از ثبت → همچنان ۱ | ✅ |

### Medium

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| AN-M1 | امکان نصب GTM | هیچ راه امنی برای افزودن کانتینر نبود. CSP (`script-src 'self'`، `connect-src 'self'`) هر تگ Google را مسدود می‌کرد. افزودن دستی در کد، خطر نصب تکراری یا نصب در پنل مدیریت را داشت | — | فیلد «شناسه Google Tag Manager» در پنل: فقط `GTM-[A-Z0-9]{4,12}` (کد کامل GTM هم پذیرفته و به شناسه کاهش داده می‌شود). مقدار دیگر (مثلاً `UA-…`) خطا می‌دهد. اسکریپت با `next/script` فقط در Layout سایت عمومی، با `id="gtm"` (Next آن را یک بار اجرا می‌کند). CSP: `https://www.googletagmanager.com` در script-src و میزبان‌های GA4 در connect-src و img-src (طبق راهنمای CSP گوگل) | E2E: ذخیره `UA-…` رد می‌شود. `gtm-ab12cd3` → `GTM-AB12CD3`. یک Loader و یک `gtm.js` حتی بعد از ناوبری کلاینتی. در پنل هیچ. پاک‌کردن شناسه → بدون تگ | ✅ |

### Low / informational

- **مسیریابی و Pageview:** رویداد `page_view` دستی ارسال نمی‌شود. با GTM و GA4، «Enhanced measurement → Page changes based on browser history events» تغییر مسیر App Router را می‌گیرد. اگر در GTM هم Trigger «History Change» برای Pageview ساخته شود، Pageview دوبار شمرده می‌شود. این تنظیم در حساب است، نه کد (بخش ۱۴).
- **UTM:** ریدایرکت اسلش پایانی اپ پارامترها را نگه می‌دارد (`/seo/?utm_source=…` → `308 /seo?utm_source=…`، تست E2E). ریدایرکت دامنه‌ها (nginx، `www` و `http`) هم باید Query را نگه دارد. این در `verify` روی Production بررسی می‌شود (بخش ۱۳). ذخیره UTM در رکورد سرنخ پیاده نشد (قابلیتش وجود نداشت و ساخت CRM خارج از این فاز است).
- **تعداد رویداد و کاربر یکتا:** در GA4، «Event count» هر کلیک را می‌شمرد (دو کلیک روی تماس = ۲)، ولی «Total users» برای یک نفر ۱ است. برای سنجش سرنخ از `generate_lead` (Key event) استفاده کنید، نه `phone_click`. کلیک روی تماس یعنی تماس برقرار شد را ثابت نمی‌کند (روی دسکتاپ اغلب کاری نمی‌کند).

## 4. Reproduction evidence

- **AN-H2 (قبل):** در `submit-action.ts` هر سه مسیر `return { status: "success" }` بودند: خط Honeypot، `isDuplicateLead` و پایان ذخیره.
- **بعد، از E2E روی Build همین شاخه:**
  ```
  contact, empty submit        → dataLayer: []
  typed name/phone/desc        → [{event:"form_start",form:"contact"}]
  valid submit                 → + {event:"generate_lead",form:"contact",service:"seo"}   leads: 1
  same request again (new page)→ [{event:"form_start",form:"contact"}]                    leads: 1
  pricing: submit w/o choice   → [{event:"form_start",form:"estimate"}]
  choices + submit             → + pricing_start{service:"web-design"} + generate_lead{…, estimate_total_toman: <DB total>}
  header → /contact → Back     → generate_lead count: 1
  ```
- **داده شخصی:** در JSON کامل `dataLayer` بعد از ثبت، نام، شماره (کامل و ۷ رقم آخر) و شناسه اجرا جستجو شد: هیچ.
- **کنترل منفی:** `tests/e2e/analytics.test.mjs` روی Build فاز ۹: ۳ از ۴ تست شکست خورد (بدون رویداد). تست UTM از قبل سبز بود (محافظ، نه اصلاح).

## 5. Fixes implemented

AN-H1، AN-H2 و AN-M1 (بخش ۳).

## 6. Files changed

- جدید: `src/lib/analytics.ts`، `src/components/organisms/analytics-listener.tsx`، `src/components/atoms/tag-manager.tsx`
- `src/components/templates/site-shell.tsx` (Listener و GTM فقط در سایت عمومی)
- `src/components/organisms/cta-section.tsx` (`data-placement="cta"` برای بلوک دعوت به اقدام پایان صفحات)
- `src/components/organisms/contact-form.tsx`، `src/components/organisms/sections/pricing/estimate-panel.tsx`، `src/components/organisms/sections/pricing/pricing-calculator.tsx`
- `src/modules/leads/submit-action.ts`، `src/modules/pricing/actions.ts` (فیلد `lead`)
- `src/modules/settings/{types,defaults,actions}.ts`، `src/components/organisms/admin/general-settings-form.tsx` (`gtmId`)
- `next.config.ts` (CSP)
- تست‌ها: `tests/unit/analytics.test.mjs`، `tests/e2e/analytics.test.mjs`، `tests/e2e/journeys.test.mjs`
- `.github/workflows/deploy.yml`: UTM در بررسی دامنه، و تست Analytics روی Production

## 7. Tests added or updated

| تست | چه چیزی | CI | Production |
| --- | --- | --- | --- |
| واحد: Schema | فقط کلیدهای مجاز. نام، تلفن، ایمیل و پیام حتی اگر اشتباهی پاس شوند حذف می‌شوند. مقدار نامعتبر حذف و عدد گرد می‌شود | ✅ | — |
| واحد: `trackOnce` / `ctaTarget` | یک بار برای هر scope و key. لینک به همان صفحه، `/contacts` و دامنه دیگر CTA حساب نمی‌شوند | ✅ | — |
| E2E: تماس | `floating` و `footer`، هر کلیک یک رویداد | ✅ | ✅ |
| E2E: CTA | `hero` → `contact`، بعد از ناوبری کلاینتی باقی می‌ماند. بلوک پایانی `/about` → `cta`. لینک به همان صفحه رویداد ندارد | ✅ | ✅ |
| E2E: GTM و PII | حداکثر یک نصب، بدون شناسه هیچ اسکریپت Google. مقدار تایپ‌شده ارسال نمی‌شود | ✅ | ✅ |
| E2E: UTM | `utm_*` و `gclid` در ریدایرکت اسلش پایانی حفظ می‌شوند | ✅ | ✅ |
| سفر: فرم تماس | خطا → ۰، ثبت → ۱، تکرار → ۰، بدون PII | ✅ | — (نوشتن داده) |
| سفر: ماشین‌حساب | `form_start` → `pricing_start` → `generate_lead` با مبلغ سرور. Back → همچنان ۱ | ✅ | — |
| سفر: GTM در پنل | اعتبارسنجی، نرمال‌سازی، یک نصب، نه در پنل، حذف | ✅ | — |
| `verify`: دامنه | `https://www…/seo?utm_…` و `http://…/?gclid=…` → ۳۰۱ با همان Query | — | ✅ |

## 8. Regression results

روی Build تولیدی همین شاخه و دیتابیس تازه:

| بررسی | نتیجه |
| --- | --- |
| Lint / Typecheck / Build | ✅ |
| واحد | ✅ ۲۸/۲۸ |
| سئو | ✅ ۱۶/۱۶ |
| امنیت | ✅ ۸/۸ (+۱ Skip عمدی، مثل قبل) |
| E2E (سفرها، چیدمان، دسترس‌پذیری، Analytics) | ✅ ۳۰/۳۰ |
| دیتابیس | ✅ ۴/۴ |
| کنترل منفی (Build فاز ۹) | ❌ ۳/۴، شکست مورد انتظار |

## 9. Git branch and commit SHA(s)

- اصلاحات و تست‌ها: `a0d5c2a` (شاخه `phase-10-analytics`)
- Merge در `main`: `40c2622f2fbb7f71615b670262ef6f67df970d3b`

## 10. PR

[irancss/seodaily#15](https://github.com/irancss/seodaily/pull/15) — Merge شد.

## 11. CI status

- PR #15 (اجرای `36471863631`): `check` ✅
- `main` (اجرای `36473560585`): `check` ✅ · `deploy` ✅ · `verify` ✅

## 12. Deployment status

✅ Deploy خودکار.

## 13. Production verification

در job `verify` روی `https://seodaily.ir`، همه ✅:

- **Analytics events on production:**
  - تماس شناور و فوتر: هر کدام یک `phone_click` با `placement` درست
  - CTA در Hero و بلوک پایانی
  - حداکثر یک نصب GTM، و بدون شناسه هیچ اسکریپت Google بار نمی‌شود
  - مقدار تایپ‌شده در `dataLayer` نیست
  - UTM در ریدایرکت اسلش پایانی حفظ می‌شود
- **نسخه‌های دامنه با Query:** `https://www…/seo?utm_source=ci&utm_medium=verify` و `http://seodaily.ir/?gclid=ci` → یک ۳۰۱ به `https://seodaily.ir/…` با همان پارامترها
- Smoke، سئو ۱۶/۱۶، امنیت، چیدمان و دسترس‌پذیری

تبدیل‌ها (`generate_lead`) فقط در CI و روی دیتابیس یک‌بارمصرف آزمایش می‌شوند. روی Production درخواست ساختگی ثبت نشد.

## 14. Remaining manual items

این موارد به حساب‌ها یا تصمیم شما نیاز دارند و در کد قابل انجام نیستند:

1. **ساخت حساب و کانتینر:** یک کانتینر GTM (Web) و یک Property در GA4 بسازید، شناسه `GTM-…` را در پنل (تنظیمات → عمومی) وارد کنید. کد آماده است و تا آن موقع چیزی بار نمی‌شود.
2. **داخل GTM:**
   - تگ «Google tag» با شناسه GA4 (`G-…`) روی All Pages.
   - برای هر رویداد بالا، یک Trigger از نوع Custom Event (`phone_click`، `cta_click`، `form_start`، `pricing_start`، `generate_lead`) و تگ GA4 Event با همان نام. پارامترها از Data Layer Variables خوانده شوند (`placement`، `target`، `form`، `service`، `estimate_total_toman`).
   - Trigger «History Change» برای Pageview **نسازید**. Enhanced measurement این کار را می‌کند.
3. **داخل GA4:** `generate_lead` را Key event کنید. در صورت نیاز، `estimate_total_toman` را Custom metric (مقدار به تومان است) و `form`، `service` و `placement` را Custom dimension کنید.
4. **Consent (تصمیم حقوقی و کسب‌وکاری):** اگر بازدیدکننده از حوزه‌هایی با الزام رضایت کوکی (مثل اتحادیه اروپا) دارید، قبل از فعال‌کردن GTM باید درباره بنر رضایت و Consent Mode تصمیم بگیرید. متن حقوقی نوشته نشد و ادعای انطباق نمی‌شود. کد فعلی تا وقتی شناسه وارد نشود هیچ کوکی تحلیلی نمی‌سازد.
5. **Search Console:** کد تأیید در پنل پشتیبانی می‌شود. وضعیت مالکیت، ارسال Sitemap و ایندکس فقط با دسترسی به حساب قابل بررسی است.
6. **اعتبارسنجی نهایی:** بعد از وارد کردن شناسه، با GTM Preview (Tag Assistant) و GA4 DebugView یک ثبت فرم آزمایشی انجام دهید و سپس سرنخ آزمایشی را از پنل حذف کنید.
