# Security Audit — seodaily.ir (Phase 02)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-02-security` · پایه: `main` @ `5ca68b1`
>
> همه آزمون‌های نفوذی روی Build تولیدی محلی با دیتابیس یک‌بارمصرف انجام شد. روی Production فقط بررسی‌های فقط‌خواندنی (هدرها، مسیرهای محافظت‌شده، آپلود، خطاها) اجرا می‌شود: بدون ورود، بدون ارسال فرم، بدون بار.

## 1. Executive summary

- هیچ آسیب‌پذیری **Critical یا High** پیدا نشد. همه اکشن‌ها و صفحات پنل مجوز را روی سرور بررسی می‌کنند. CSRF، تزریق SQL، XSS، آپلود و SSRF با شواهد بررسی شدند و امن بودند.
- **سه مورد Medium** پیدا و اصلاح شد:
  1. محدودیت نرخ فرم‌های درخواست با یک هدر `X-Forwarded-For` جعلی دور زده می‌شد (امکان اسپم نامحدود).
  2. کوکی ورود بعد از خروج یا تغییر رمز تا ۷ روز معتبر می‌ماند (بدون ابطال سمت سرور).
  3. پرچم `Secure` کوکی فقط به متغیر `COOKIE_SECURE` وابسته بود و فایل نمونه `.env` آن را `false` می‌گذاشت.
- **پنج مورد Low** اصلاح شد: CSP و HSTS، ترمز ورود قابل‌سوءاستفاده برای قفل‌کردن مدیر، خطای ۵۰۰ برای URLهای خراب، ثبت اطلاعات شخصی در لاگ خطا، و پیکربندی Apache.
- ۹ تست امنیتی خودکار اضافه شد (`tests/security.test.mjs`): کامل در CI، و نسخه فقط‌خواندنی بعد از هر Deploy روی Production.

## 2. Baseline and scope

### Attack surface و مرز اعتماد

| سطح | موارد | کنترل |
| --- | --- | --- |
| صفحات عمومی (SSR) | `/`، `/web-design`، `/seo`، `/services[/slug]`، `/pricing`، `/portfolio[/slug]`، `/about`، `/contact`، `robots.txt`، `sitemap.xml` | فقط خواندن؛ داده از DB |
| Server Actions عمومی | `submitConsultation` (تماس)، `submitEstimate` (ماشین‌حساب)، `login` | اعتبارسنجی zod، Honeypot، محدودیت نرخ، بررسی Origin توسط Next |
| صفحات پنل (۱۸ صفحه) | `/admin/**` | `proxy.ts` (بررسی اولیه) + `requireAdmin()` در `(panel)/layout.tsx` و صفحات |
| Server Actions پنل (۲۶ اکشن) | خدمات، پروژه‌ها، FAQ، تیم، منو، تعرفه، قرارداد، تنظیمات، صفحات، درخواست‌ها، حساب | اولین خط هر اکشن `await requireAdmin()` (بررسی خودکار: هیچ اکشنی بدون آن نیست) |
| Route Handlers | `GET /api/health`، `GET /uploads/[name]` | فقط خواندن |
| آپلود | ذخیره از طریق اکشن‌های پنل در `UPLOAD_DIR` | Magic bytes، ۵ مگابایت، نام تصادفی |
| سرور | nginx/Apache (TLS) → `127.0.0.1:3000` (app) → `db` (شبکه داخلی Docker) | پورت اپ فقط روی localhost؛ پورت DB منتشر نشده |
| CI/CD | GitHub Actions → SSH → `docker load` | Secrets گیت‌هاب |

جریان داده: بازدیدکننده → nginx (`X-Real-IP`، `X-Forwarded-Proto`) → Next.js → PostgreSQL. داده بازدیدکننده (lead) فقط در پنل نمایش داده می‌شود. داده مدیر (متن‌ها، منو، لینک‌ها) در صفحات عمومی رندر می‌شود.

### بررسی‌شده و امن (بدون تغییر)

| موضوع | شواهد |
| --- | --- |
| مجوز سمت سرور | همه ۲۶ اکشن پنل با `requireAdmin()` شروع می‌شوند. `(panel)/layout.tsx` هم `requireAdmin()` دارد. تست: ۶ مسیر پنل بدون کوکی → ریدایرکت به ورود |
| نقش‌ها / سطح شیء | فقط یک نقش (مدیر) وجود دارد. کاربر عادی یا داده متعلق به کاربر دیگر نیست |
| CSRF | Next.js در اکشن‌ها `Origin` را با `Host`/`X-Forwarded-Host` مقایسه می‌کند. تست: POST با `Origin: https://evil.example` → ۵۰۰ «Invalid Server Actions request» و هیچ رکوردی ثبت نشد. کوکی `SameSite=Lax` |
| XSS | React همه متن‌ها را Escape می‌کند. `dangerouslySetInnerHTML` فقط در `JsonLd` (با Escape کردن `<`) و آیکون‌های ثابت است. `RichText` فقط لینک‌های `/…` و `http(s)` می‌سازد. `cleanUrl`/`cleanMenuUrl` مقدار `javascript:` را بی‌اثر می‌کنند (`https://javascript:…` یا `/javascript:…`). لینک وب‌سایتِ lead در پنل همیشه `http(s)` است |
| SQL Injection | همه کوئری‌ها با Drizzle یا Tagged Template پارامتری `postgres` هستند. هیچ `sql.raw` یا الحاق رشته‌ای وجود ندارد |
| Command/Template injection | هیچ `exec`/`spawn`/`eval` در کد اپ نیست |
| SSRF / Open redirect | سرور هیچ URL کاربر را fetch نمی‌کند. `/_next/image` برای URL خارجی یا `169.254.169.254` پاسخ ۴۰۰ می‌دهد. مقصد همه `redirect()`ها ثابت است |
| آپلود | نوع فایل از Magic bytes تشخیص داده می‌شود (JPEG/PNG/WebP/AVIF/GIF)، **SVG پذیرفته نمی‌شود**، سقف ۵ مگابایت، نام تصادفی ۶۴ بیتی، سرو فقط برای `^[a-z0-9-]+\.[a-z0-9]+$` و پسوندهای تصویری، `nosniff`. تست: Traversal و SVG/HTML → ۴۰۰/۴۰۴ |
| رمز عبور | bcrypt با cost 12. مقایسه با Hash ساختگی برای ایمیل ناموجود (بدون افشای زمانی). پیام خطای یکسان. حداقل ۸ کاراکتر |
| اعتبارنامه پیش‌فرض | ندارد. مدیر فقط با `ADMIN_EMAIL`/`ADMIN_PASSWORD` سرور ساخته می‌شود |
| Secrets در مخزن | جستجو در همه کامیت‌های تاریخچه برای کلید خصوصی، توکن GitHub/AWS/OpenAI/Slack و رمزهای Hard-code: **هیچ**. `.env` در مخزن نیست |
| اطلاعات خطا | صفحه ۴۰۴ و خطاهای Production بدون Stack، مسیر فایل یا SQL (تست ۶) |
| Container | کاربر غیر root (`nextjs:1001`)، پورت فقط `127.0.0.1`، DB بدون پورت منتشرشده، Source map مرورگر خاموش، `poweredByHeader: false` |
| کش پاسخ‌های پنل | `Cache-Control: private, no-cache, no-store` و `X-Robots-Tag: noindex` |
| وابستگی‌های Production | `npm audit --omit=dev`: **۰ آسیب‌پذیری** |

## 3. Confirmed findings

### Critical
هیچ.

### High
هیچ.

### Medium

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| S-M1 | فرم تماس و ماشین‌حساب (`modules/leads/rate-limit.ts`) | ۷ ارسال پشت‌سرهم با `X-Forwarded-For: 10.8.N.1, 127.0.0.1` (همان شکلی که nginx می‌سازد): **هر ۷ ثبت شد** با وجود سقف ۵ در ۱۰ دقیقه | `clientIp()` **اولین** مقدار `X-Forwarded-For` را می‌خواند. nginx با `$proxy_add_x_forwarded_for` آدرس واقعی را به **انتهای** مقدار ارسالی کاربر اضافه می‌کند، پس مقدار اول را کاربر تعیین می‌کند | `src/lib/rate-limit.ts`: ترتیب `X-Real-IP` (که nginx بازنویسی می‌کند) → **آخرین** مقدار `X-Forwarded-For` → `unknown`. Apache هم `X-Real-IP` را تنظیم می‌کند | تست ۹: ۶ ارسال با XFF جعلی متفاوت و آدرس واقعی یکسان → پنج ثبت، ششمی محدود | ✅ |
| S-M2 | نشست مدیر (`modules/auth/session.ts`) | کوکی JWT فقط `sub` داشت. «خروج» فقط کوکی مرورگر را پاک می‌کرد و تغییر رمز هیچ نشستی را باطل نمی‌کرد: یک کوکی کپی‌شده تا ۷ روز کار می‌کرد | نشست کاملاً Stateless بود | جدول `sessions` (Migration `0003_sessions`، فقط `CREATE TABLE`). کوکی حامل `sid` تصادفی ۲۵۶ بیتی است. `getCurrentUser` نشستِ زنده و منقضی‌نشده را در DB می‌خواهد. خروج ردیف را حذف می‌کند. تغییر رمز همه نشست‌های دیگر آن کاربر را باطل می‌کند. ردیف‌های منقضی هنگام ورود بعدی پاک می‌شوند | تست ۳: توکن با امضای درست ولی بدون نشست زنده (فرمت قدیم یا `sid` جعلی) → رد. تست ۷: بعد از خروج، همان کوکی دیگر کار نمی‌کند و نشست دوم سالم می‌ماند | ✅ |
| S-M3 | کوکی نشست | `secure: process.env.COOKIE_SECURE === "true"`. در `.env.example` مقدار `COOKIE_SECURE=false` است و فایل Compose Production فقط وقتی مقدار خالی باشد `true` می‌گذارد. اگر `.env` سرور از روی نمونه ساخته شده باشد، کوکی بدون `Secure` است و در اولین درخواست `http://` (قبل از 301) به‌صورت متن ساده ارسال می‌شود | وابستگی به تنظیم دستی | کوکی وقتی `Secure` است که `COOKIE_SECURE=true` باشد **یا** درخواست از HTTPS آمده باشد (`X-Forwarded-Proto: https` که nginx/Apache تنظیم می‌کنند). توسعه محلی روی HTTP همچنان کار می‌کند | تست ۷: ورود با `X-Forwarded-Proto: https` → `Secure; HttpOnly; SameSite=lax; Path=/` | ✅ (مقدار `.env` سرور از اینجا قابل‌مشاهده نیست؛ اصلاح مستقل از آن است) |

### Low

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| S-L1 | هدرهای پاسخ (`next.config.ts`) | پاسخ‌ها `Content-Security-Policy` و `Strict-Transport-Security` نداشتند (HSTS در nginx کامنت شده بود) | — | CSP: `default-src 'self'`، `object-src 'none'`، `base-uri 'self'`، `form-action 'self'`، `frame-ancestors 'self'`، تصویر `self data: blob:`، فونت `self data:`. `'unsafe-inline'` برای اسکریپت‌های Bootstrap نکست و استایل‌های Inline ری‌اکت لازم است. `unsafe-eval` فقط در حالت توسعه. HSTS: `max-age=31536000` (بدون includeSubDomains/preload چون زیردامنه‌ها بررسی نشده‌اند) | تست ۱. پیمایش مرورگر: ۱۰ صفحه عمومی و ۱۳ صفحه پنل **بدون هیچ خطای Console یا نقض CSP**. E2E کامل پنل (ورود، آپلود، ویرایش، تعرفه، قرارداد، منو) سبز | ✅ |
| S-L2 | ورود (`modules/auth/actions.ts`) | ترمز فقط بر اساس ایمیل بود (۸ خطا در ۱۵ دقیقه): هر کسی با ۸ رمز غلط، مدیر واقعی را ۱۵ دقیقه قفل می‌کرد. Map بدون سقف با ایمیل‌های تصادفی رشد می‌کرد | کلید ناکافی | ۸ خطا برای هر (آدرس + ایمیل)، سقف ۳۰ خطا برای هر ایمیل از همه آدرس‌ها، Map با اندازه محدود (`slidingWindow`)، طول ورودی محدود | تست ۸: بعد از ۸ خطا، حتی رمز درست از همان آدرس رد می‌شود، ولی آدرس دیگر وارد می‌شود | ✅ |
| S-L3 | همه مسیرها | `/%E0%A4%A`، `/services/%ff`، `/portfolio/%E0%A4%A` → **۵۰۰** (بدون افشای اطلاعات) | Percent-escape خراب، Router را پیش از صفحه می‌شکند | `proxy.ts` برای مسیرهای رمزگشایی‌نشدنی **۴۰۰** برمی‌گرداند. Matcher به همه مسیرها جز `_next/static` و `_next/image` گسترش یافت. بررسی مدیریت فقط برای `/admin` است | تست ۶ | ✅ |
| S-L4 | لاگ خطای فرم‌ها | `console.error("…", error)`: خطای درایور Postgres متن کوئری و **پارامترها** (نام، تلفن، توضیح) را دارد | ثبت کل شیء خطا | `errorSummary()` فقط نام و کد خطا را ثبت می‌کند (`src/lib/log.ts`) | بازبینی کد | ✅ |
| S-L5 | `deploy/apache-seodaily.ir.conf` | `X-Real-IP` تنظیم نمی‌شد | — | `RequestHeader set X-Real-IP "%{REMOTE_ADDR}s"` | — | ✅ (فقط برای سرورهای Apache) |
| S-L6 | CI/CD (`deploy.yml`) | وقتی Secret `DEPLOY_KNOWN_HOSTS` خالی است، کلید سرور با `ssh-keyscan` در لحظه اعتماد می‌شود (TOFU) | راحتی راه‌اندازی | بدون تغییر در کد؛ کار دستی (بخش ۱۴) | — | ⏳ نیاز به شما |

### Informational
- `npm audit` (همه وابستگی‌ها): ۴ مورد Moderate در `esbuild <=0.24.2` از مسیر `drizzle-kit` (فقط **ابزار توسعه**). مربوط به Dev server است و در ایمیج Production نیست. رفع آن نیاز به ارتقای ناسازگار `drizzle-kit` دارد. پذیرفته و ثبت شد.

## 4. Reproduction evidence

- **S-M1**
  - قبل: Build تولیدی `5ca68b1`، فرم `/contact` با ارسال بدون جاوااسکریپت، ۷ درخواست با `X-Forwarded-For: 10.8.{0..6}.1, 127.0.0.1` → `SAVED ×7`، و `select count(*) from leads` = 7.
  - بعد: تست ۹ → `saved ×5, limited`.
- **S-M2**
  - قبل: فقط `jwtVerify` + وجود کاربر. هر توکن امضاشده با `sub` معتبر بود.
  - بعد (تست ۳): توکن `{sub:"1"}` با امضای درست → ریدایرکت به ورود.
  - بعد (تست ۷): ورود → کوکی A → خروج → درخواست با A → ریدایرکت به ورود.
- **CSRF** (کنترل): `Origin: https://evil.example` → ۵۰۰. لاگ سرور: «x-forwarded-host … does not match origin … Aborting the action». تعداد leadها تغییر نکرد.
- **S-L3**: `curl /services/%ff` → ۵۰۰ «Internal Server Error». بعد از اصلاح → ۴۰۰.

## 5. Fixes implemented

1. آدرس کلاینت قابل‌اعتماد و محدودکننده مشترک با حافظه محدود (`src/lib/rate-limit.ts`).
2. نشست‌های سمت سرور با ابطال هنگام خروج و تغییر رمز (`sessions` + `0003_sessions.sql`).
3. کوکی `Secure` خودکار روی HTTPS.
4. CSP و HSTS.
5. ترمز ورود دوسطحی.
6. پاسخ ۴۰۰ برای URL خراب.
7. لاگ بدون داده شخصی.
8. `X-Real-IP` در پیکربندی Apache و توضیح در nginx.

**اثر Deploy:** کوکی‌های قبلی `sid` ندارند، پس بعد از این Deploy مدیر یک‌بار باید دوباره وارد شود. داده‌ای حذف نمی‌شود.

## 6. Files changed

- `src/lib/rate-limit.ts` (جدید)، `src/lib/log.ts` (جدید)
- `src/modules/leads/rate-limit.ts`، `src/modules/leads/submit-action.ts`، `src/modules/pricing/actions.ts`
- `src/modules/auth/session.ts`، `src/modules/auth/actions.ts`، `src/modules/auth/account-actions.ts`
- `src/db/schema.ts`، `drizzle/0003_sessions.sql`، `drizzle/meta/*`
- `src/proxy.ts`، `next.config.ts`
- `deploy/apache-seodaily.ir.conf`، `deploy/nginx-seodaily.ir.conf`
- `tests/security.test.mjs` (جدید)، `package.json` (`test:security`؛ `test:seo` فقط فایل سئو را اجرا می‌کند)
- `.github/workflows/deploy.yml`

## 7. Tests added or updated

`tests/security.test.mjs` (Node test runner، بدون وابستگی):

| # | تست | CI | Production |
| --- | --- | --- | --- |
| 1 | هدرهای امنیتی (CSP، HSTS، nosniff، frame، referrer، بدون X-Powered-By، no-store پنل) | ✅ | ✅ |
| 2 | پنل بدون نشست یا با کوکی جعلی → ورود | ✅ | ✅ |
| 3 | توکن با امضای درست ولی بدون نشست زنده → رد | ✅ | — (نیاز به Secret) |
| 4 | اکشن با Origin خارجی رد می‌شود (CSRF) | ✅ | ✅ (درخواست رد می‌شود، چیزی ثبت نمی‌شود) |
| 5 | آپلود: Traversal، SVG، HTML، مسیر تو در تو → ۴۰۴ | ✅ | ✅ |
| 6 | URL خراب → ۴۰۰؛ خطاها بدون جزئیات داخلی | ✅ | ✅ |
| 7 | پرچم‌های کوکی و ابطال با خروج | ✅ | — (نیاز به ورود) |
| 8 | ترمز ورود | ✅ | — |
| 9 | محدودیت نرخ با XFF جعلی | ✅ | — (ارسال فرم) |

در CI یک مدیر یک‌بارمصرف فقط برای دیتابیس CI ساخته می‌شود. تست‌های نیازمند ورود یا ارسال، بدون `ADMIN_EMAIL`/`ADMIN_PASSWORD` خودکار Skip می‌شوند. به همین دلیل اجرای Production هیچ داده‌ای نمی‌سازد.

## 8. Regression results

روی Build تولیدی همین شاخه:

| بررسی | نتیجه |
| --- | --- |
| Lint / Typecheck / Build | ✅ |
| تست‌های امنیتی | ✅ ۹/۹ (کامل) · ✅ ۵/۵ + ۴ Skip (حالت فقط‌خواندنی) |
| تست‌های سئو (دیتابیس تازه) | ✅ ۱۶/۱۶ |
| E2E پنل و سایت: ورود، رمز غلط، ویرایش متا، ساخت پروژه، آپلود و رد فایل جعلی، تنظیمات، فرم تماس، درخواست‌ها، sitemap، خروج | ✅ ۱۹/۱۹ |
| E2E ماشین‌حساب عمومی (۲۷ بررسی) و ویرایشگر تعرفه، درخواست و قرارداد (۳۱ بررسی) | ✅ |
| E2E ویرایشگر منو | ✅ |
| پیمایش Console/CSP روی ۲۳ صفحه | ✅ بدون خطا |
| Migration `0003` روی دیتابیس تازه و موجود | ✅ |

## 9. Git branch and commit SHA(s)

بخش ۱۳.

## 10. PR

بخش ۱۳.

## 11. CI status

بخش ۱۳.

## 12. Deployment status

بخش ۱۳.

## 13. Production verification

بعد از Merge در این بخش ثبت می‌شود.

## 14. Remaining manual items

1. **`DEPLOY_KNOWN_HOSTS` (S-L6):** اگر این Secret در GitHub خالی است، روی سرور `ssh-keyscan -p <port> <host>` را اجرا کنید، خروجی را با اثرانگشت واقعی سرور مقایسه کنید و در Settings → Secrets → Actions با نام `DEPLOY_KNOWN_HOSTS` ذخیره کنید.
2. **پیکربندی Proxy واقعی سرور:** محدودیت نرخ به `X-Real-IP` (یا آخرین مقدار `X-Forwarded-For`) تکیه دارد. در nginx موجود همین مخزن هر دو تنظیم شده‌اند. اگر پیکربندی سرور با فایل مخزن فرق دارد، مطمئن شوید `proxy_set_header X-Real-IP $remote_addr;` وجود دارد.
3. **ورود مجدد:** بعد از این Deploy، یک‌بار دوباره وارد پنل شوید.

## Checklist

- [x] Inventory و مرز اعتماد
- [x] ۳ مورد Medium و ۵ مورد Low اصلاح شد
- [x] ۹ تست امنیتی
- [x] Lint / Typecheck / Build
- [x] Regression کامل (سئو، E2E، CSP)
- [ ] CI این فاز
- [ ] Merge و Deploy
- [ ] بررسی امنیتی Production
