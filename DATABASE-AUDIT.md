# Database & Data Integrity Audit — seodaily.ir (Phase 07)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-07-db` · PostgreSQL 16 + Drizzle
>
> همه آزمون‌های مخرب (قطع وسط Seed، داده خراب، ۲۰٬۰۰۰ ردیف آزمایشی، پشتیبان‌گیری و بازیابی) روی **دیتابیس‌های یک‌بارمصرف** انجام شد. به دیتابیس Production دست زده نشد.

## 1. Executive summary

- **Schema drift ندارد:** `drizzle-kit generate` روی Schema فعلی پیام «No schema changes» داد. همه ۴ Migration روی دیتابیس خالی و روی نصب قدیمی (`90e6cfb`) اجرا می‌شوند.
- **یک مورد High پیدا و اصلاح شد:** Seed اولیه ۱۴ خدمت را بدون تراکنش درج می‌کرد. اگر اولین راه‌اندازی کانتینر وسط کار قطع می‌شد، راه‌اندازی بعدی جدول را «خالی‌نشده» می‌دید و **۷ خدمت برای همیشه ساخته نمی‌شد**. خروجی Seed هم آن‌ها را «kept» گزارش می‌کرد. اکنون هر گروه Seed (دسته‌ها، خدمات همراه نشانگر نسخه، ارتقای محتوا، سؤالات) در یک تراکنش است.
- **یک مورد Medium اصلاح شد:** یک مقدار JSON با نوع اشتباه در `settings` (ردیف دستی‌ویرایش‌شده یا قالب قدیمی) صفحه اصلی را با **۵۰۰** از کار می‌انداخت. اکنون مقدار ناسازگار نادیده گرفته می‌شود و مقدار پیش‌فرض می‌ماند.
- **پشتیبان‌گیری و بازیابی واقعاً آزموده شد:** `pg_dump -Fc` و سپس `pg_restore` روی دیتابیس یک‌بارمصرف. تعداد ردیف همه جدول‌ها، Hash محتوای خدمات و اجرای اپ روی نسخه بازیابی‌شده یکسان و درست بود. **پشتیبان‌گیری خودکار در Production وجود ندارد** و به فاز ۱۱ ارجاع شد.
- ۴ تست دیتابیسی جدید (`tests/db/seed.test.mjs`) که در CI روی دیتابیس‌های موقت اجرا می‌شوند.

## 2. Baseline and scope

### Schema inventory

| جدول | کلید | قیود و روابط | ایندکس‌ها | زمان | ملاحظات |
| --- | --- | --- | --- | --- | --- |
| `users` | `id` serial | `email` یکتا | `users_email_idx` | `created_at` | Hash رمز (bcrypt) |
| `sessions` (فاز ۲) | `id` text | `user_id` → `users` **ON DELETE CASCADE** | `sessions_user_idx` | `created_at`، `expires_at` | ردیف‌های منقضی هنگام ورود بعدی پاک می‌شوند |
| `categories` | `slug` | — | PK | — | ۲ دسته |
| `services` | `id` serial | `slug` یکتا، `category` → `categories.slug` (NO ACTION) | `services_slug_idx` | `created_at`، `updated_at` | محتوای JSONB (`sections`، `faqs` و …) |
| `projects` | `id` serial | `slug` یکتا | `projects_slug_idx` | `created_at`، `updated_at` | `published`، `featured`، `is_case_study` |
| `faqs` | `id` serial | — | PK | — | `page` (enum در اپ) |
| `team_members` | `id` serial | — | PK | — | `published` |
| `leads` | `id` serial | — | PK | `created_at`، `updated_at` | **داده شخصی** (بخش ۱۳) |
| `settings` | `key` | — | PK | `updated_at` | JSONB (عمومی، تماس، صفحات، منو، تعرفه، قرارداد، نسخه محتوا) |
| `drizzle.__drizzle_migrations` | — | — | — | — | ۴ ردیف |

### قیود کسب‌وکاری

| قاعده | اجرا در DB | ارزیابی |
| --- | --- | --- |
| نامک یکتای خدمت و پروژه | ✅ Unique index | مسابقه هم‌زمان هم به خطای یکتایی می‌خورد و پیام «نامک تکراری» نمایش داده می‌شود (فاز ۳، E2E ۴) |
| ایمیل یکتای کاربر | ✅ | — |
| دسته معتبر برای خدمت | ✅ FK. حذف دسته دارای خدمت ممکن نیست؛ اکشن حذف دسته هم وجود ندارد | درست |
| نشست متعلق به کاربر | ✅ FK با Cascade | حذف کاربر همه نشست‌هایش را باطل می‌کند |
| وضعیت و نوع خدمت درخواست | در اپ (`LEAD_STATUSES`، `SERVICE_CHOICES`) | قید CHECK اضافه نشد: فقط اکشن‌های اعتبارسنجی‌شده می‌نویسند و قید جدید روی داده موجود Production بدون بررسی آن ریسک دارد |
| ترتیب نمایش | عدد آزاد | یکتایی لازم نیست؛ مرتب‌سازی با `sort_order, id` پایدار است |

## 3. Confirmed findings

### Critical
هیچ.

### High

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| D-H1 | `scripts/seed.mjs` (اولین راه‌اندازی) | Trigger آزمایشی که درج هشتم را با خطا متوقف می‌کند. اجرای اول Seed شکست خورد و **۷ خدمت در جدول ماند**. پس از حذف Trigger، اجرای دوم: `service content v2: updated 7, kept (edited or missing): technical-seo, keyword-research, …` و در نهایت `select count(*) from services` = **7** | درج‌ها بدون تراکنش. شرط «جدول خالی» بعد از شکست نیمه‌کاره دیگر برقرار نبود | `sql.begin()` برای هر گروه: دسته‌ها، (خدمات + نشانگر نسخه محتوا)، ارتقای محتوا (به‌روزرسانی‌ها + نشانگر)، سؤالات | `tests/db/seed.test.mjs` تست ۲: بعد از شکست ۰ ردیف و بعد از راه‌اندازی دوم ۱۴. روی نسخه قبلی: `expected 0, actual 7` ❌ | ✅ |

### Medium

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| D-M1 | `settings` → همه صفحات عمومی | مقدار `general` = `{"industries": "x", "budgets": 5}` → `/` **۵۰۰** (`TypeError`) | `readSetting` هر مقدار ذخیره‌شده را بدون بررسی نوع روی پیش‌فرض می‌نوشت | فقط مقداری با همان نوع پیش‌فرض (متن، عدد، آرایه یا شیء) پذیرفته می‌شود. در غیر این صورت پیش‌فرض می‌ماند | بازتولید روی Build جدید: `/` ۲۰۰ و فهرست پیش‌فرض صنف‌ها نمایش داده می‌شود | ✅ |

### Low / Informational

| ID | موضوع | یافته | تصمیم |
| --- | --- | --- | --- |
| D-L1 | ایندکس برای `leads` | با **۲۰٬۰۰۰** درخواست آزمایشی، `EXPLAIN ANALYZE` برای فهرست پنل (مرتب‌سازی نزولی، صفحه ۲۰۰ با فیلتر وضعیت)، شمارش «جدید» و کوئری ضدتکرار همگی Seq scan و **۲٫۶ تا ۴٫۶ms** بودند | ایندکس اضافه نشد (بدون سود و با هزینه نوشتن) |
| D-L2 | مسابقه دو ارسال یکسان در یک لحظه | بررسی ضدتکرار (فاز ۳) در تراکنش نیست، پس دو درخواست دقیقاً هم‌زمان ممکن است هر دو ثبت شوند | پیامد: یک درخواست تکراری در پنل. برای یک فرم تماس قفل یا قید یکتا زیاده‌روی است |
| D-L3 | نوشتن‌های چندمرحله‌ای اپ | پروژه همراه Case study در تراکنش است (موجود). سایر اکشن‌ها یک نوشتن دارند. تصویر با `stageImage` هماهنگ شده است (فاز ۳) | درست |
| D-L4 | Migration ناموفق در Deploy | اجرای Drizzle Migrator تراکنشی است، پس Migration ناموفق چیزی را نیمه‌کاره نمی‌گذارد و `set -e` در entrypoint کانتینر را متوقف می‌کند. ولی کانتینر قبلی پیش از آن جایگزین شده است | ارجاع به فاز ۱۱ (اتمیک‌بودن Deploy) |

## 4. Reproduction evidence

- **D-H1:** اسکریپت SQL:
  ```sql
  create function fail_on_8th() returns trigger language plpgsql as $$
  begin if (select count(*) from services) >= 7 then raise exception 'simulated crash'; end if; return new; end $$;
  create trigger crash before insert on services for each row execute function fail_on_8th();
  ```
  سپس `node scripts/seed.mjs` (شکست) و حذف Trigger و اجرای دوباره.
  - قبل: ۷ خدمت.
  - بعد: ۰، سپس ۱۴، سپس اجرای سوم بدون تغییر.
- **D-M1:** `insert into settings … ('general', '{"industries": "x", "budgets": 5}')` و سپس `curl /` → ۵۰۰ (قبل) و ۲۰۰ (بعد).
- **پشتیبان‌گیری و بازیابی:**
  ```
  pg_dump -Fc -d …/seodaily_p7 -f p7.dump          # 430,819 bytes (با ۲۰٬۰۰۰ درخواست)
  createdb seodaily_p7r && pg_restore --no-owner -d …/seodaily_p7r p7.dump
  ```
  | جدول | مبدأ | بازیابی |
  | --- | --- | --- |
  | services / faqs / categories / settings | 14 / 20 / 2 / 1 | 14 / 20 / 2 / 1 |
  | leads | 20000 | 20000 |
  | `__drizzle_migrations` | 4 | 4 |

  `md5(string_agg(slug‖overview‖sections))` خدمات در هر دو یکسان: `904eef4b5d10dcca5f1f02955b6c03d9`. اجرای `migrate` روی نسخه بازیابی‌شده: «migrations applied» (بدون تغییر). سرور اپ روی نسخه بازیابی‌شده: `/`، `/services/technical-seo`، `/pricing`، `/sitemap.xml`، `/api/health` همه ۲۰۰.

## 5. Fixes implemented

1. تراکنش برای هر گروه Seed و ارتقای محتوا (D-H1).
2. ادغام نوع‌امن تنظیمات ذخیره‌شده با پیش‌فرض‌ها (D-M1).
3. تست‌های دیتابیسی در CI.

## 6. Files changed

- `scripts/seed.mjs`
- `src/modules/settings/queries.ts`
- `tests/db/seed.test.mjs` (جدید)، `package.json` (`test:db`)
- `.github/workflows/deploy.yml` (اجرای `test:db` در CI)

## 7. Tests added or updated

`tests/db/seed.test.mjs`. هر تست یک دیتابیس موقت می‌سازد و در پایان حذف می‌کند:

| # | تست |
| --- | --- |
| 1 | نصب تازه: Migrate و Seed → ۱۴ خدمت با محتوای کامل. اجرای دوم هیچ ردیفی را تغییر نمی‌دهد |
| 2 | قطع وسط Seed → صفر ردیف. راه‌اندازی بعدی → ۱۴ |
| 3 | ارتقای محتوا از نسخه قدیمی: ۱۳ به‌روزرسانی، ردیف ویرایش‌شده مدیر دست‌نخورده، فقط یک‌بار برای هر نسخه |
| 4 | Migration: اجرای دوم بدون تغییر. تعداد Migrationهای اعمال‌شده = تعداد فایل‌های `drizzle/*.sql` |

## 8. Regression results

بخش ۱۳.

## 9–13. Git, PR, CI, Deploy, Production

بعد از Merge ثبت می‌شود.

## 13-bis. Connection management

- Pool اپ: `postgres` با `max: 10` و `connect_timeout: 5` (فاز ۳)، یک Pool برای هر پردازه.
- `migrate.mjs` و `seed.mjs` هر کدام یک اتصال دارند و در پایان `sql.end()` می‌کنند.
- در آزمون بار فاز ۵ (۲۰ اتصال هم‌زمان) تعداد اتصال‌ها از سقف بالاتر نرفت و نشتی دیده نشد.

## 13-ter. Seeds

| نوع | محتوا | رفتار در Production |
| --- | --- | --- |
| پایه لازم | کاربر مدیر (فقط اگر هیچ کاربری نباشد و `ADMIN_*` تنظیم شده باشد)، دسته‌ها (`on conflict do nothing`) | هرگز چیزی را بازنویسی نمی‌کند |
| محتوای اولیه | خدمات و سؤالات، فقط اگر جدول خالی باشد | با تراکنش (D-H1) |
| ارتقا و Backfill | محتوای خدمات نسخه ۲، فقط ردیف‌هایی که `updated_at = created_at` (هرگز در پنل ذخیره نشده‌اند) | هر نسخه یک‌بار، اتمیک |
| نمایشی یا تستی | ندارد | — |

## 14. Data retention / PII & remaining manual items

**داده شخصی ذخیره‌شده:** در `leads` نام، تلفن، نام کسب‌وکار، وب‌سایت، بودجه، توضیح پروژه، برآورد و یادداشت مدیر. در `users` ایمیل مدیر. نشست‌ها IP یا User-Agent ذخیره نمی‌کنند. درخواست‌ها تا زمانی که مدیر حذفشان نکند می‌مانند. لاگ‌ها داده فرم را ثبت نمی‌کنند (فاز ۲).

نیاز به تصمیم شما، طبق دستور فاز بدون سیاست ساختگی:
1. **مدت نگهداری درخواست‌ها** (مثلاً حذف یا ناشناس‌سازی خودکار بعد از n ماه) و متن حریم خصوصی مرتبط.
2. **پشتیبان‌گیری خودکار Production:** در مخزن وجود ندارد. در فاز ۱۱ طراحی و پیاده می‌شود (Dump زمان‌دار، نگهداری، نگهداری بیرون از پوشه اپ، آزمون بازیابی).
