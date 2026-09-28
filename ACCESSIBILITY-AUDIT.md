# Accessibility Audit (WCAG 2.2 AA) — seodaily.ir (Phase 09)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-09-a11y`
>
> ابزار خودکار (axe-core 4.13، همان موتور Lighthouse) همراه با آزمون دستی صفحه‌کلید، درخت دسترس‌پذیری و Reflow. ابزار خودکار انطباق کامل را ثابت نمی‌کند. هدف، انطباق عملی با WCAG 2.2 AA برای تجربه پیاده‌شده است.

## 1. Executive summary

- **سایت عمومی:**
  - axe روی ۱۱ صفحه، در ۳۹۰ و ۱۲۸۰ پیکسل، در حالت نهایی (بعد از نمایش محتوای Scroll-reveal): **صفر خطا**، شامل کنتراست رنگ. هشدار کنتراست Lighthouse در `/pricing` (فاز ۵) از لحظه وسط انیمیشن بود، نه رنگ نهایی.
  - آزمون دستی صفحه‌کلید سالم بود: لینک پرش، Focus قابل‌مشاهده، ترتیب، منوی موبایل با Escape و بازگشت Focus، ماشین‌حساب با صفحه‌کلید.
- **پنل مدیریت:** ۳ خطای واقعی axe اصلاح شد:
  1. فیلد انتخاب فایل تصویر بدون برچسب (خدمت، پروژه، تنظیمات).
  2. لینک داخل `<summary>` (کنترل تعاملی تو در تو، ۸ مورد).
  3. همان لینک‌ها با هدف لمسی ۴×۱۶ پیکسل.
- **اعلام تکراری پیام‌ها:** در فرم تماس و ماشین‌حساب، پیام موفقیت یا خطا **دو بار** برای صفحه‌خوان خوانده می‌شد (پیام درون فرم با `role=alert/status` و Toast در Live region). Toast در این موارد اکنون فقط دیداری است.
- تست خودکار `tests/e2e/a11y.test.mjs` در CI اجرا می‌شود (عمومی و پنل) و بعد از هر Deploy روی Production (صفحات عمومی).

## 2. Baseline and scope

| بخش راهنما | روش | نتیجه |
| --- | --- | --- |
| ۱. خودکار | axe (wcag2a/2aa/21a/21aa/22aa)، ۱۱ صفحه عمومی × ۲ عرض + ورود + ۹ صفحه پنل | عمومی ۰. پنل ۳ نوع خطا (بخش ۳) |
| ۲. صفحه‌کلید | Playwright: Tab و Enter و Space و Escape | اولین Tab «پرش به محتوا» است (قابل‌مشاهده) و Enter فوکوس را به `main` می‌برد. Focus در همه ۴۰ توقف اول صفحه اصلی قابل‌مشاهده است (outline ۳px). منوی موبایل: `<dialog>` بومی، Escape آن را می‌بندد و فوکوس به دکمه منو برمی‌گردد (فاز ۴). FAQ: `<details>/<summary>` بومی. رادیوهای ماشین‌حساب با Space |
| ۳. معنا | Landmarkها و تیترها | `header` / `nav` (با نام: منوی اصلی، مسیر صفحه، خدمات، دسترسی سریع) / `main` / `footer`، هر کدام یکی. صفحه خدمت: ۳۷ تیتر، یک H1، **بدون پرش سطح** |
| ۴. نام دسترس‌پذیر | همه `a` و `button` | همه نام دارند (دکمه‌های آیکونی با `aria-label`، مثل «باز کردن منو» و «تماس تلفنی: …») |
| ۵. فرم‌ها | فرم تماس بعد از ارسال خالی | `label[for]`، `required`، `aria-invalid="true"`، `aria-describedby` به پیام خطای همان فیلد، `autocomplete` (`name`، `tel`)، `type=tel`، خلاصه خطا با `role=alert` که فوکوس می‌گیرد. Honeypot داخل `aria-hidden` با `tabIndex=-1`. ماشین‌حساب: ۶ `fieldset`، همه با `legend` |
| ۶. کنتراست | axe روی حالت نهایی | ۰ خطا |
| ۷. Reflow/Zoom | عرض ۳۲۰px (معادل زوم ۴۰۰٪ در ۱۲۸۰) و ۶۴۰px (زوم ۲۰۰٪) | بدون اسکرول دوبعدی (تست چیدمان فاز ۴ در ۸ عرض) |
| ۸. حرکت | CSS | همه انیمیشن‌ها و `scroll-behavior: smooth` فقط زیر `prefers-reduced-motion: no-preference`. Marquee با Hover یا Focus متوقف می‌شود |
| ۹. تصاویر | alt | تصاویر محتوایی alt دارند (عنوان پروژه، خدمت، نام عضو تیم). تصاویر تزئینی `alt=""` یا `aria-hidden` |
| ۱۱. زبان و جهت | `<html lang="fa-IR" dir="rtl">` | ✅. آدرس‌ها، شماره‌ها و ایمیل با `dir="ltr"` (تلفن، URL پیش‌نمایش گوگل) |
| ۱۲. اندازه هدف | axe `target-size` (۲۴×۲۴ یا فاصله کافی) | عمومی ✅ (لینک‌های Breadcrumb با شرط فاصله). پنل ❌ (بخش ۳) |
| ۱۳. پیام‌های وضعیت | Live regionها | ❌ اعلام تکراری (بخش ۳) |
| ۱۴. پنل | ورود، منو، فرم‌ها، Repeater، جدول | پس از اصلاح، axe بدون خطا. Repeaterها دکمه با برچسب (بالا، پایین، حذف) دارند و Drag-only نیستند |

## 3. Confirmed findings

### Critical / High (پنل)

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| A11Y-H1 | انتخاب فایل تصویر: خدمت، پروژه، تنظیمات (`ImageField`) | axe `label` (critical): «Element does not have an implicit (wrapped) `<label>`» | عنوان فیلد `<span>` بود | `<label htmlFor>` و `id` برای input. راهنمای فرمت با `aria-describedby` | a11y پنل | ✅ |
| A11Y-H2 | `/admin/pages` (۸ صفحه) | axe `nested-interactive` (serious): `#home > summary`. `target-size` (serious): لینک ۴×۱۶px | لینک «مشاهده صفحه» داخل `<summary>` (خود دکمه باز و بسته) بود | لینک بیرون از `summary`، با متن «مشاهده صفحه» و مسیر LTR، `min-h-6` | a11y پنل | ✅ |

### Medium

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| A11Y-M1 | فرم تماس، ثبت برآورد، خطای گروه ماشین‌حساب | بعد از ارسال، پیام درون فرم (`role=alert` یا `status` که فوکوس هم می‌گیرد) **و** Toast با همان پیام در Live region (`role=alert/status`) → صفحه‌خوان پیام را دو بار می‌خواند | Toastها برای این موارد هم در Live region بودند | گزینه `{ silent: true }` در `toast`. Toast دیداری می‌ماند ولی در ظرف `aria-hidden` (بدون اعلام). ۵ فراخوانی در این سه جریان | بازبینی کد. E2E همچنان Toast را می‌بیند | ✅ |

### Low / informational

- عبارت‌های انگلیسی کوتاه (مثل «Landing Page»، «Core Web Vitals») `lang="en"` ندارند. صفحه‌خوان‌های فارسی آن‌ها را درست می‌خوانند، ولی می‌شد برچسب زد. به‌خاطر اثر کم تغییری داده نشد.
- صفحه‌خوان واقعی (NVDA/VoiceOver) در این محیط در دسترس نبود. به‌جای آن درخت دسترس‌پذیری (نام، نقش، وضعیت، `aria-*`) با Playwright و axe بررسی شد.

## 4. Reproduction evidence

- **قبل** (Build فاز ۸، axe روی پنل):
  ```
  /admin/pages nested-interactive (serious) ×8: #home > summary
  /admin/pages target-size (serious) ×8: a[href="/"][target="_blank"][dir="ltr"]
  /admin/settings label (critical) ×1: .file\:me-3
  (و /admin/services/1 label)
  ```
- **بعد:** `admin pages: no WCAG 2.2 AA violations` ✅.
- **صفحه‌کلید:**
  - `1st Tab: A «پرش به محتوا» outline solid 3px, visible`
  - `after Enter: #content, next Tab lands in main: true`
  - `tab stops without visible focus (of 40): none`

## 5. Fixes implemented

A11Y-H1، A11Y-H2 و A11Y-M1 (بخش ۳).

## 6. Files changed

- `src/components/molecules/image-field.tsx`
- `src/components/organisms/admin/page-text-editor.tsx`
- `src/lib/toast.ts`، `src/components/organisms/toaster.tsx`
- `src/components/organisms/contact-form.tsx`، `src/components/organisms/sections/pricing/estimate-panel.tsx`، `src/components/organisms/sections/pricing/pricing-calculator.tsx`
- `tests/e2e/a11y.test.mjs` (جدید)، `package.json` (`axe-core@4.13.0` فقط در devDependencies)
- `.github/workflows/deploy.yml` (a11y روی Production)

## 7. Tests added or updated

`tests/e2e/a11y.test.mjs`:

| تست | CI | Production |
| --- | --- | --- |
| صفحات عمومی ۳۹۰px، بدون خطای WCAG 2.2 AA | ✅ | ✅ |
| صفحات عمومی ۱۲۸۰px | ✅ | ✅ |
| ورود و ۹ صفحه پنل | ✅ | — (نیاز به ورود) |
| صفحه‌کلید: لینک پرش اول، رفتن به `main`، Focus قابل‌مشاهده در ۳۰ توقف | ✅ | ✅ |

## 8. Regression results

روی Build تولیدی همین شاخه:

| بررسی | نتیجه |
| --- | --- |
| Lint / Typecheck / Build | ✅ |
| واحد | ✅ ۲۲/۲۲ |
| سئو | ✅ ۱۶/۱۶ |
| امنیت | ✅ ۹/۹ |
| E2E (سفرها، چیدمان، دسترس‌پذیری) | ✅ ۲۵/۲۵ |
| کنترل منفی: a11y پنل روی Build قبلی | ❌ شکست مورد انتظار |

## 9. Git branch and commit SHA(s)

- اصلاحات و تست‌ها: `db03792` (شاخه `phase-09-a11y`)
- Merge در `main`: `bd51e0ae1e6a9b9810f059b7949030b52dde7a48`

## 10. PR

[irancss/seodaily#14](https://github.com/irancss/seodaily/pull/14) — Merge شد.

## 11. CI status

- PR #14 (اجرای `36469561878`): `check` ✅، شامل axe روی صفحات عمومی و پنل.
- `main` (اجرای `36470985021`): `check` ✅ · `deploy` ✅ · `verify` ✅.

## 12. Deployment status

✅ Deploy خودکار.

## 13. Production verification

در job `verify` روی `https://seodaily.ir`، همه ✅:
- **Accessibility on production:** axe WCAG 2.2 AA روی صفحات عمومی در ۳۹۰ و ۱۲۸۰ پیکسل بدون خطا، و آزمون صفحه‌کلید (لینک پرش، Focus قابل‌مشاهده)
- Smoke test، نسخه‌های دامنه، سئو، امنیت و چیدمان

## 14. Remaining manual items

- اختیاری: آزمون با صفحه‌خوان واقعی (NVDA در ویندوز یا VoiceOver در موبایل) روی فرم تماس و ماشین‌حساب، توسط خود شما یا یک کاربر.
