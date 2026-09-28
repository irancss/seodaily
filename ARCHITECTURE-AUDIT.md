# Code Quality & Architecture Audit — seodaily.ir (Phase 06)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-06-arch` · پایه: `phase-05-perf`
>
> هدف این فاز بازنویسی نیست. کد فعلی کار می‌کند و در فازهای قبل ۶۰+ تست خودکار گرفته است. فقط مشکلات مشخص و اثبات‌شده اصلاح شد.

## 1. Executive summary

- کیفیت پایه بالاست:
  - `strict` TypeScript.
  - **صفر** `any`، **صفر** `@ts-ignore`/`@ts-expect-error`/`eslint-disable`.
  - یک `as unknown as`.
  - مرز سرور/کلاینت با `import "server-only"` در ۲۵ ماژول قفل شده است.
  - همه اکشن‌های پنل `requireAdmin()` دارند (فاز ۲).
  - اعتبارسنجی سمت سرور مستقل از کلاینت است (فاز ۳).
- اصلاحات این فاز:
  1. **اعتبارسنجی پیکربندی هنگام شروع:** در Production، نبود `DATABASE_URL` یا `SESSION_SECRET` ضعیف قبلاً بی‌صدا به پیش‌فرض‌های توسعه می‌افتاد (دیتابیس `localhost`). اکنون سرور با پیام روشن متوقف می‌شود.
  2. **حذف کد مرده:** `GridBackdrop`، `HeroBadge` و `SystemDiagram` (با ۴ Helper داخلی)، یعنی ۱۲۱ خط بدون هیچ ارجاعی.
  3. **یکی‌کردن تبدیل ارقام فارسی و عربی:** دو پیاده‌سازی جدا (`lib/utils` و `leads/fields`) در `toLatinDigits` یکی شد.

## 2. Architecture map

```
src/app/                      مسیرها (App Router)
 ├─ (site)/…                  صفحات عمومی (SSR، force-dynamic) → modules/*/queries (کش‌شده) → components
 ├─ admin/(panel)/…           پنل: layout با requireAdmin() → modules/admin/*-queries → organisms/admin
 ├─ admin/login               فرم ورود → modules/auth/actions
 ├─ api/health, uploads/[…]   Route Handlerها
 ├─ robots.ts, sitemap.ts     modules/seo + modules/*/queries
 ├─ error.tsx, not-found.tsx  مرزهای خطا
 └─ layout.tsx                html/body، فونت، Toaster
src/proxy.ts                  URL خراب → ۴۰۰؛ بررسی اولیه JWT برای /admin/*
src/instrumentation.ts        → lib/check-env (فقط Node، فقط Production)
src/modules/<domain>/         لایه دامنه (بدون UI)
 ├─ queries.ts                خواندن از DB با cached() (تگ «content»)؛ server-only
 ├─ actions.ts                Server Actionها: requireAdmin → اعتبارسنجی/نرمال‌سازی → DB → updateTag → redirect با پیام
 ├─ normalize.ts / types.ts   منطق خالص (بدون IO)؛ با تست واحد (pricing، menus)
 └─ …                         auth (نشست DB-محور)، leads (فرم‌ها، ضدتکرار، محدودیت نرخ)، uploads (ذخیره مرحله‌ای)، seo (متادیتا/JSON-LD)، settings (پیش‌فرض + مقدار ذخیره‌شده)، contracts (قالب و مبلغ به حروف)
src/components/               atoms → molecules → organisms → templates (Barrel برای هر لایه)
 └─ organisms/sections/<page>/ بخش‌های هر صفحه عمومی
src/lib/                      ابزار مشترک: cache، form-actions، rate-limit، log، utils، check-env
src/db/                       schema.ts (Drizzle، منبع نوع‌ها) و index.ts (Pool)
scripts/                      migrate.mjs، seed.mjs (+ service-content/*)، windows/*.ps1
drizzle/                      Migrationهای SQL (۰۰۰۰ تا ۰۰۰۳)
tests/                        seo، security (HTTP)؛ unit (TS مستقیم)؛ e2e (Playwright)
deploy/, docker/, Dockerfile  Compose Production، nginx/Apache، entrypoint (migrate → seed → server)
```

**مرزهای واقعی (نه فقط اسم پوشه):**

| مرز | چه چیزی آن را تضمین می‌کند |
| --- | --- |
| DB فقط سمت سرور | `import "server-only"` در `db/index.ts`، `lib/cache.ts`، `modules/*/queries`. Import از کامپوننت کلاینت خطای Build می‌دهد |
| مجوز پنل | `requireAdmin()` در layout پنل و خط اول هر اکشن. `proxy.ts` فقط بررسی اولیه است |
| داده حساس به کلاینت | صفحات پنل فقط فیلدهای لازم را به کامپوننت‌های کلاینت (ویرایشگرها) می‌دهند. `passwordHash` و نشست‌ها از `getCurrentUser` بیرون نمی‌روند (`{ id, email, name }`) |
| نوع‌ها | `db/schema.ts` منبع اصلی است (`$inferSelect` و نوع‌های JSON مثل `LeadEstimate` و `ContentSection`). نوع‌های دامنه (`PricingGroup`) کنار منطق خود هستند |
| اعتبارسنجی | فرم‌های عمومی: zod (`leads/fields.ts`). پنل: `str/int/bool/rows` با طول حداکثر، به‌علاوه `normalize*` برای JSONها (منو، تعرفه). محیط: `check-env.ts` |
| کش و ابطال | همه خواندن‌های عمومی با `cached()` و تگ `content`. همه ذخیره‌های پنل از `saved()`/`failed()` در `lib/form-actions` می‌گذرند که `updateTag(CONTENT_TAG)` را صدا می‌زند |

## 3. Confirmed findings

### Critical / High
هیچ.

### Medium

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| A-M1 | پیکربندی Runtime | سرور Production بدون `DATABASE_URL` بالا می‌آمد (`✓ Ready`) و فقط در اولین کوئری به `postgres://localhost:5432/seodaily` وصل می‌شد. `/api/health` → ۵۰۳ بدون علت روشن. در مسیر Docker، `migrate.mjs` جلوی آن را می‌گرفت، ولی اجرای دستی (`npm start`، اسکریپت‌های ویندوز) نه | Fallback توسعه در `db/index.ts` (برای Build بدون DB لازم است) و نبود اعتبارسنجی هنگام شروع | `src/instrumentation.ts` در Runtime Node فایل `lib/check-env.ts` را بار می‌کند. در Production نبود `DATABASE_URL` یا `SESSION_SECRET` کوتاه‌تر از ۳۲ کاراکتر → پیام «Invalid configuration» و خروج با کد ۱. نبود `SITE_URL` → هشدار. Build و توسعه تأثیری نمی‌گیرند | اجرای دستی: `env -u DATABASE_URL SESSION_SECRET=short node server.js` → پیام و خروج. پیکربندی درست → ۲۰۰ | ✅ |

### Low

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| A-L1 | کامپوننت‌ها | `GridBackdrop` و `HeroBadge` (atoms) و `SystemDiagram` (+ `SystemDiagramCompact`، `SystemDiagramFull`، `DiagramLabel`، `DIAGRAM_LABEL`، `Bar`) در هیچ فایلی جز تعریف خودشان ارجاع ندارند (جستجوی `grep -w` در `src`) | باقی‌مانده از بازطراحی | حذف (۱۲۱ خط) و حذف از Barrel | Typecheck، Lint، Build، E2E چیدمان (۹ صفحه × ۸ عرض) | ✅ |
| A-L2 | ارقام فارسی و عربی | دو پیاده‌سازی مستقل: `phoneDigits` در `lib/utils.ts` و `normalizeDigits` در `leads/fields.ts`. اصلاح یکی به دیگری نمی‌رسید | تکرار | `toLatinDigits()` در `lib/utils.ts`. `phoneDigits` و `normalizeDigits` از آن استفاده می‌کنند | تست‌های واحد تلفن (ارقام فارسی و عربی) | ✅ |

### بررسی‌شده، بدون تغییر

| موضوع | یافته |
| --- | --- |
| `"use client"` | ۲۴ فایل، همه تعاملی (فرم، منو، ویرایشگر، Toast). کامپوننت نمایشی بی‌دلیل سمت کلاینت نیست |
| کیفیت TypeScript | بالا (بخش ۱). نوع‌های فرم از schema و zod مشتق شده‌اند |
| خطاها | اکشن‌های پنل: الگوی یکسان `failed(path, message)` / `saved(path)` (Redirect + Toast). اکشن‌های عمومی: `ActionState` با `errors` برای هر فیلد. خطای DB بدون جزئیات به کاربر می‌رسد و بدون داده شخصی لاگ می‌شود (فاز ۲). مرز خطای صفحه (فاز ۳) |
| `catch` خالی | فقط `deleteImage` (حذف فایلی که شاید دیگر نباشد): عمدی و درست |
| دسترسی داده | کوئری‌ها در `modules/*/queries`. تراکنش جایی که چند نوشتن وابسته است (پروژه با Case study). ابطال کش متمرکز |
| وابستگی‌ها | `bcryptjs`، `drizzle-orm`، `jose`، `next`، `postgres`، `react`، `react-dom`، `server-only`، `zod`: همه استفاده می‌شوند. Dev: `playwright-core` (E2E) و بقیه ابزار Build |
| لاگ | فقط خطاها، با پیشوند ماژول و بدون PII |
| تست | سه لایه با مرز روشن (unit / HTTP / مرورگر) و بدون fixture تکراری. E2E روی دیتابیس یک‌بارمصرف و با آدرس IP یکتا برای هر مرورگر |
| Non-goals | بدون تغییر Framework، ORM، دیتابیس یا ساختار پوشه‌ها |

## 4. Reproduction evidence

- **A-M1:**
  - قبل: سرور بدون `DATABASE_URL` → `✓ Ready`، `/api/health` → ۵۰۳.
  - بعد: `Invalid configuration: - DATABASE_URL is not set - SESSION_SECRET must be at least 32 characters` و خروج.
  - اولین تلاش (`process.exit` مستقیم در `instrumentation.ts`) هشدار Build «Ecmascript file had an error» داد، چون فایل برای Edge هم کامپایل می‌شود. کد Node-only به `lib/check-env.ts` منتقل شد که فقط با `NEXT_RUNTIME === "nodejs"` بار می‌شود. Build بدون هشدار.
- **A-L1:** `grep -rlw <name> src` برای هر Export → فقط فایل تعریف.

## 5. Fixes implemented

بخش ۳: A-M1، A-L1 و A-L2.

## 6. Files changed

- `src/instrumentation.ts` (جدید)، `src/lib/check-env.ts` (جدید)
- `src/lib/utils.ts`، `src/modules/leads/fields.ts`
- `src/components/organisms/illustrations.tsx`، `src/components/atoms/index.ts`
- حذف: `src/components/atoms/grid-backdrop.tsx`، `src/components/atoms/hero-badge.tsx`

## 7. Tests added or updated

تست جدیدی لازم نبود. تست‌های واحد تلفن و ارقام، رفتار یکی‌شده را پوشش می‌دهند. تست‌های چیدمان و E2E حذف کد مرده را پوشش می‌دهند.

## 8. Regression results

بخش ۱۳.

## 9–13. Git, PR, CI, Deploy, Production

بعد از Merge ثبت می‌شود.

## 14. Remaining manual items

ندارد.
