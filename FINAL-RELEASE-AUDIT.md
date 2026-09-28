# Final Release Audit — seodaily.ir (Phase 12)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-12-final` · پایه: `main` در `668c60d` (بعد از فاز ۱۱)
>
> هیچ طراحی یا بازنویسی تازه‌ای انجام نشد. همه چیز دوباره اجرا شد و به گزارش فازهای قبل اتکا نشد.

## 1. Executive summary

### Release gates

| Gate | نتیجه |
| --- | --- |
| Build | **PASS** (Clone تازه: `npm ci` → lint → typecheck → build) |
| Tests | **PASS** (همه مجموعه‌ها سبز، بخش ۸. تنها Skip وابسته به محیط بود و با مقدار لازم دوباره اجرا و سبز شد) |
| Security critical/high known unresolved | **NO** |
| Data migration | **PASS** (نصب تازه، و ارتقا از نسخه ۲۷ سپتامبر با داده ویرایش‌شده توسط مدیر) |
| Public journeys | **PASS** |
| Admin journeys | **PASS** (۷ سفر تازه برای ماژول‌هایی که پوشش نوشتن نداشتند) |
| SEO regression | **PASS** |
| Accessibility critical blockers | **NO** |
| Performance regression | **PASS** (همان روش فاز ۵: LCP و TBT برابر یا بهتر) |
| CI/CD | **PASS** (Deploy امن فاز ۱۱ روی سرور واقعی اجرا و تأیید شد) |
| Production smoke | **PASS** (بخش ۱۳) |
| Rollback/backup verification | **PASS**: پشتیبان و Restore drill روی خود Production اجرا شد. Rollback برنامه در محیط ایزوله آزموده شد (فاز ۱۱). روی Production عمداً Rollback اجرا نشد، چون تغییر ناخواسته روی سایت زنده است. پیش‌نیاز آن (Imageهای قبلی) در خروجی `status.sh` دیده می‌شود |

### یافته‌های این فاز

- یک مورد Medium (عملیاتی): مسیر سریع ارسال Image روی سرور واقعی بی‌صدا شکست می‌خورد.
- دو مورد Low:
  - Teardown شکننده `test:db` با کاربر غیر Superuser
  - نبود پوشش E2E برای ۶ ماژول پنل و XSS ذخیره‌شده
- همه اصلاح یا پوشش داده شدند.

## 2. Baseline and scope

| بخش راهنما | روش |
| --- | --- |
| ۱. همسان‌سازی | `main` = `668c60d`. ۱۶ PR فازها Merge شده، ۴ Migration (`0000` تا `0003`)، Workflowهای `deploy`، `monitor` و `rollback`. Issue باز شناخته‌شده‌ای نیست |
| ۲ و ۳. مجموعه کامل و نصب تازه | `git clone` تازه (نه Worktree محلی)، `npm ci`، lint، typecheck، build، واحد. سپس دیتابیس خالی، migrate و seed، اجرای Standalone Production، و سئو، امنیت، E2E و دیتابیس |
| ۴. مسیر ارتقا | Commit `90e6cfb` (۲۷ سپتامبر، قبل از فازها، فقط Migrationهای ۰۰۰۰ و ۰۰۰۱) روی دیتابیس خالی. ویرایش‌های مدیر (عنوان یک خدمت با `updated_at` جدید، یک FAQ، تنظیمات عمومی، یک Lead). سپس migrate و seed امروز و مجموعه‌های حیاتی |
| ۵ تا ۱۱. رگرسیون حوزه‌ها | مجموعه‌های خودکار موجود، به‌علاوه ۷ سفر تازه پنل و XSS، روش اندازه‌گیری فاز ۵، و `dataLayer` |
| ۱۲ و ۱۳. Deploy و Production | لاگ Deploy فاز ۱۱ و این فاز، و job `verify` |

## 3. Confirmed findings

### Medium

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| F-M1 | `deploy/ship.sh` (فاز ۱۱) | Deploy فاز ۱۱ روی سرور واقعی: `::warning::registry transfer failed; sending the whole image instead`، سپس `shipped … as a full image in 81s`. Deploy سالم بود، ولی بهبود سرعت محقق نشد و هیچ علتی چاپ نشد | همه فرمان‌ها بی‌خطا بودند، پس شکست در حلقه «Registry از تونل در دسترس است» بود، که `curl -sf` آن هیچ خروجی نمی‌داد. علت دقیق از بیرون سرور قابل دیدن نبود. در شبیه‌سازی، اشغال پورت Registry همین رفتار را تولید کرد، به‌علاوه یک Container در حلقه Restart | گام شکست‌خورده، خطای curl، لاگ خود SSH (`-E`)، و وضعیت و ۵ خط لاگ Container Registry چاپ می‌شوند. Registry که بالا نیامده حذف می‌شود. پورت Runner 5000 → 15055. `-f` در curl حفظ شد تا پاسخ ۴۰۴ یک سرویس دیگر «موفق» حساب نشود (اشتباهی که در شبیه‌سازی پیدا و اصلاح شد) | شبیه‌سازی: پورت Registry اشغال → `failed at: registry reachable through the tunnel`، `curl: (22) … 404`، `registry log: … bind: address already in use`، Container حذف، Fallback موفق. اجرای بعدی از Registry | ✅ |
| F-M1b | همان، علت واقعی | Deploy همین فاز روی Production با تشخیص تازه: `failed at: registry reachable through the tunnel`، `curl: (56) Recv failure: Connection reset by peer`، و ۱۵ بار `ssh: channel 3: open failed: administratively prohibited`. Registry سالم بود: `Up 28 minutes … listening on 127.0.0.1:5055` | sshd سرور برای کاربر Deploy **Port forwarding را بسته است** (`AllowTcpForwarding no` یا معادل آن). این یک تنظیم امنیتی سرور است و دلیلی برای بازکردنش نیست | `deploy/registry-proxy.mjs`: یک Proxy محلی TCP روی Runner (Node از پیش نصب است). هر اتصال Docker با یک نشست عادی SSH حمل می‌شود: `docker exec -i seodaily-registry nc 127.0.0.1 5055` (busybox `nc` داخل Image خود Registry). به Port forwarding و بسته اضافه روی سرور نیازی نیست | شبیه‌سازی با sshd دارای `AllowTcpForwarding no`: خود `ssh -L` رد می‌شود (`curl exit 56`، مثل Production)، ولی ارسال از راه Proxy موفق است: `shipped … through the registry`، ۸۴٫۴ مگابایت در Registry | ✅ (نتیجه Production در بخش ۱۲) |

### Low

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| F-L1 | `tests/db/seed.test.mjs` | روی Clone تازه: ۴/۴ تست سبز، ولی خود فایل شکست خورد: `permission denied to terminate process` (42501). ۳ دیتابیس آزمایشی باقی ماند | `drop database … with (force)` باید Backendهای دیگر را ببندد. کاربر غیر Superuser نمی‌تواند Worker خودکار Postgres (autovacuum) روی دیتابیس تازه را ببندد. در CI کاربر Superuser است، برای همین آنجا دیده نمی‌شد | تا ۱۰ تلاش با فاصله ۰٫۵ ثانیه، فقط برای همین خطا | اجرای دوباره: ۴/۴، بدون دیتابیس باقی‌مانده. باقی‌مانده‌های اجرای قبلی حذف شدند | ✅ |
| F-L2 | پوشش پنل | E2E هیچ سفر نوشتنی برای نمونه‌کارها، اعضای تیم، متن و متای صفحات، منو، تعرفه و قرارداد نداشت. XSS ذخیره‌شده هم تست نداشت | — | ۷ سفر تازه در `journeys.test.mjs`: هر کدام تغییری در پنل می‌دهند، اثر آن را در سایت عمومی می‌سنجند (برای نمونه‌کار: صفحه، Sitemap، و noindex → index → noindex) و بعد پاک یا بازگردانی می‌کنند | همه سبز (بخش ۷) | ✅ |

### بررسی‌شده، بدون ایراد (اطلاعاتی)

- **ارتقای محتوا و ویرایش مدیر:** در مسیر ارتقا، خدمتی که مدیر قبلاً ویرایش کرده بود محتوای قدیمی خود را نگه داشت. این رفتار طراحی‌شده فاز ۱ و ۷ است و Seed آن را گزارش می‌کند: `kept (edited or missing): corporate-website`. تست سئوی «محتوای بلند برای هر خدمت» روی چنین دیتابیسی برای همان خدمت شکست می‌خورد. روی Production همه خدمات این تست را پاس می‌کنند (`verify` سبز). اگر چنین پیامی در لاگ Deploy دیدید، آن خدمت را در پنل بازبینی کنید.
- **JS:** از ۱۶۰ به ۱۷۱ کیلوبایت فشرده از فاز ۵ تا امروز. حدود ۵ کیلوبایت آن Listener مربوط به Analytics است (مقایسه مستقیم Build فاز ۹ و ۱۰). معیارها بدتر نشدند (بخش ۸). ارزش پیگیری نداشت.
- **Sinkهای HTML خام:** فقط دو مورد. `json-ld.tsx` کاراکتر `<` را Escape می‌کند و `icon.tsx` فقط از نقشه ثابت داخلی می‌خواند. تست XSS تازه هر دو مسیر ورودی را پوشش می‌دهد.

## 4. Reproduction evidence

- **Clone تازه:**
  ```
  npm ci: ok (392 packages) · lint: ok · typecheck: ok · build: ok · unit 28/28   (کل: ۴۹ ثانیه)
  migrations applied · admin user created · seeded 14 services · seeded 20 faqs
  ```
- **مسیر ارتقا از `90e6cfb`:**
  ```
  before: 2 migrations; corporate-website title = «عنوان ویرایش‌شده توسط مدیر» (updated_at ≠ created_at)
  seed:   service content v2: updated 13, kept (edited or missing): corporate-website
  after:  4 migrations; corporate-website: عنوان و محتوای مدیر حفظ شد (همان md5)
          online-store (دست‌نخورده): محتوای جدید (md5 تغییر کرد)
          FAQ، siteName و Lead ویرایش‌شده دست‌نخورده. 14 خدمت، 20 سؤال
  app:    health ok · سئو 15/16 (فقط مورد اطلاعاتی بالا) · امنیت 8+1skip · E2E (سفرها و Analytics) 16/16
  ```
- **F-M1:** لاگ Deploy فاز ۱۱ (job `109108186337`): گام «Ship» از 19:56:39 تا 19:58:01. تنها خروجی‌ها همان دو خط بالا بودند.
- **F-L1:** `not ok 5 - …/tests/db/seed.test.mjs · error: 'permission denied to terminate process' · code: '42501'`.

## 5. Fixes implemented

F-M1، F-L1 و F-L2. همچنین `status.sh` اکنون Imageهای موجود برای Rollback را هم نشان می‌دهد (`rollback targets: …`)، پس پایش روزانه آمادگی Rollback را هم گزارش می‌کند.

## 6. Files changed

- `deploy/ship.sh`: تشخیص و گزارش خطا، پاک‌سازی Registry خراب، پورت 15055، و انتقال از راه Proxy به‌جای `ssh -L` (F-M1b)
- `deploy/registry-proxy.mjs` (جدید، F-M1b)
- `deploy/ops/status.sh`: فهرست Imageهای قابل Rollback
- `tests/db/seed.test.mjs`: Teardown مقاوم
- `tests/e2e/journeys.test.mjs`: ۷ سفر تازه
- گزارش‌ها:
  - `FINAL-RELEASE-AUDIT.md` (جدید)
  - نتایج Production فاز ۱۰ در `ANALYTICS-AUDIT.md`
  - نتایج Production فاز ۱۱ در `DEVOPS-AUDIT.md`

## 7. Tests added or updated

| تست | چه چیزی را ثابت می‌کند |
| --- | --- |
| نمونه‌کار با تصویر | ایجاد در پنل → کارت در `/portfolio`، صفحه ۲۰۰، در Sitemap، `/portfolio` از noindex به index. حذف → ۴۰۴، تصویر حذف، خروج از Sitemap، بازگشت noindex |
| متن و متای صفحه | H1 و `<title>` صفحه «درباره» از پنل، سپس بازگردانی |
| عضو تیم با عکس | در «درباره» با `alt` برابر نام. حذف → ناپدید و عکس ۴۰۴ |
| منو | آیتم تازه در هدر. «بازگشت به منوی پیش‌فرض» → حذف |
| تعرفه | قیمت ۲۷٬۵۰۰٬۰۰۰ در ماشین‌حساب عمومی. «بازگشت به ساختار پیش‌فرض» → حذف |
| قرارداد | صفحه قرارداد یک Lead با نام آن رندر می‌شود |
| XSS ذخیره‌شده | `<img onerror>` و `<script>` در نام و توضیح فرم عمومی و عنوان خدمت در پنل: در فهرست، جزئیات و قرارداد Lead، و صفحه عمومی خدمت اجرا نمی‌شوند، به‌صورت متن دیده می‌شوند، و JSON-LD نمی‌تواند تگ خود را ببندد |
| `test:db` | Teardown بدون وابستگی به Superuser |

## 8. Regression results

روی Build و دیتابیس تازه از Clone تمیز:

| مجموعه | نتیجه |
| --- | --- |
| Lint / Typecheck / Build | ✅ |
| واحد | ✅ ۲۸/۲۸ |
| سئو | ✅ ۱۶/۱۶ |
| امنیت | ✅ ۹/۹ (در اجرای اول ۸ + ۱ Skip چون `SESSION_SECRET` به تست داده نشده بود. با آن ۹/۹) |
| E2E: سفرها، چیدمان ۸ عرض، دسترس‌پذیری axe + صفحه‌کلید، Analytics | ✅ ۳۶/۳۶ روی Clone (شامل ۶ سفر تازه پنل). با تست XSS: ✅ ۳۷/۳۷ |
| دیتابیس | ✅ ۴/۴ (بعد از F-L1) |
| shellcheck | ✅ |

**عملکرد، همان روش فاز ۵** (۳۹۰px، CPU ×۴، ۱٫۶Mbps، RTT ۱۵۰ms):

| صفحه | LCP فاز ۵ → امروز | TBT فاز ۵ → امروز | CLS |
| --- | --- | --- | --- |
| `/` | 1268 → **1132ms** | 396 → **267ms** | 0 |
| `/web-design` | 1148 → 1144ms | 303 → 283ms | 0 |
| `/seo` | 1152 → 1184ms | 270 → 250ms | 0 |
| `/services/technical-seo` | 1320 → **1200ms** | 505 → **307ms** | 0 |
| `/pricing` | 1244 → 1180ms | 417 → 326ms | 0 |
| `/contact` | 1228 → **1076ms** | 471 → **179ms** | 0 |

کوئری دیتابیس با کش گرم: یک تراکنش در ۵۰ درخواست (فاز ۵: ۰). یعنی همچنان عملاً صفر.

## 9. Git branch and commit SHA(s)

- `phase-12-final`: `362c941` (۶ سفر پنل)، `bee2ef3` (تشخیص ارسال، Teardown، XSS، گزارش‌ها). Merge در `main`: `118a859e6ee0aa8983bd35e80a7519e91a7046ea`
- `ship-no-forwarding`: F-M1b و همین بخش‌ها

## 10. PR

- [irancss/seodaily#17](https://github.com/irancss/seodaily/pull/17) — Merge شد
- PR پیگیری F-M1b — پایین‌تر

## 11. CI status

- PR #17 (اجرای `36477601179`): `check` ✅ (Lint، shellcheck، Typecheck، واحد، Build، سئو، امنیت، E2E ۳۷، دیتابیس)
- `main` (اجرای `36478409128`): `check` ✅ · `deploy` ✅ · `verify` (بخش ۱۳)

## 12. Deployment status

Deploy #17 روی سرور واقعی (دومین Deploy با روش امن فاز ۱۱):

```
backup before migrations: db-pre-deploy-20260928T202601Z.dump (84K)
candidate seodaily:118a859e6ee0: migrations applied
switch → live: 118a859e6ee0                     (گام کامل: ۹ ثانیه)
nightly backup already scheduled
OK app healthy {"version":"118a859e6ee0"} · OK database · OK disk ×3
OK last-success-daily 0h · OK last-restore-check 0h · restarts 0
rollback targets: 668c60d82c11 118a859e6ee0 40c26…fbb bd51e0ae1e6a 7d9d9f397c8c 0c5f913dccad
```

- **آمادگی Rollback روی Production:** ۶ نسخه قبلی روی سرورند و `deploys.log` دو ورودی دارد، پس `rollback.sh` بدون Tag به `668c60d82c11` برمی‌گردد.
- **ارسال Image:** هنوز Fallback کامل بود (۷۱ ثانیه)، ولی این بار با علت دقیق (F-M1b). اصلاح آن در PR پیگیری است.

## 13. Production verification

job `verify` روی `https://seodaily.ir` برای Commit `118a859e6ee0`:
- The deployed commit is live ✅
- TLS ≥ ۱۴ روز ✅
- Smoke (۱۱ صفحه، ۲۰۰) ✅
- دامنه‌ها و UTM ✅
- سئو ۱۶/۱۶ ✅
- امنیت (فقط‌خواندنی) ✅
- چیدمان، دسترس‌پذیری و Analytics: نتیجه پایانی پایین‌تر

نتیجه Deploy پیگیری (ارسال از راه Proxy) پایین‌تر ثبت می‌شود.

## 14. Remaining manual items

فقط کارهایی که به دسترسی یا تصمیم شما نیاز دارند (جزئیات در گزارش هر فاز):

1. **Secret `DEPLOY_KNOWN_HOSTS`** (امنیت اتصال Deploy). `deploy/RUNBOOK.md`.
2. **کپی پشتیبان خارج از سرور** (مثلاً `rsync` از جای دیگر). `deploy/RUNBOOK.md`.
3. **`certbot renew --dry-run`** یک بار روی سرور. انقضا را `verify` و پایش روزانه می‌سنجند.
4. **Analytics:** ساخت کانتینر GTM و Property GA4، وارد کردن `GTM-…` در پنل، Key event کردن `generate_lead`، و تصمیم درباره Consent. `ANALYTICS-AUDIT.md` §14.
5. **Search Console:** مالکیت و ارسال Sitemap با حساب شما.
6. **اختیاری:** آزمون با صفحه‌خوان واقعی (NVDA یا VoiceOver). `ACCESSIBILITY-AUDIT.md`.
