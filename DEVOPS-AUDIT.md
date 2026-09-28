# DevOps, Deployment & DR Audit — seodaily.ir (Phase 11)

> تاریخ: ۱۴۰۵/۰۷/۰۶ (۲۰۲۶-۰۹-۲۸) · شاخه: `phase-11-devops`
>
> **محدودیت دسترسی:** از این محیط به سرور Production (SSH یا HTTPS) دسترسی مستقیم نیست. همه تغییرات سرور از مسیر Deploy مخزن اعمال و در job `verify` و Workflow پایش بررسی می‌شوند.
>
> **شبیه‌سازی:** قبل از Push، کل مسیر روی یک شبیه‌سازی اجرا شد:
> - sshd واقعی به‌عنوان سرور
> - یک Docker daemon جدا به‌عنوان Runner گیت‌هاب
> - همان `docker-compose.prod.yml` و همان اسکریپت‌ها
>
> دستورها و نتیجه‌ها در بخش ۴ آمده‌اند.

## 1. Executive summary

| قبل | بعد |
| --- | --- |
| `docker compose up -d` کانتینر فعلی را **قبل از** اثبات سالم‌بودن نسخه جدید جایگزین می‌کرد. Migration خراب = سایت از کار افتاده و در حلقه Restart (بازتولید شد) | نسخه جدید اول به‌صورت **Candidate** کنار نسخه فعلی اجرا می‌شود (Migration، Seed، Health). خطا → Deploy متوقف و نسخه قبلی **بدون حتی یک درخواست ناموفق** Live می‌ماند. جابه‌جایی حدود ۱٫۲ ثانیه. اگر نسخه جدید سالم بالا نیاید، بازگشت خودکار |
| هیچ پشتیبان‌گیری در مخزن یا مسیر Deploy تعریف نشده بود | پشتیبان قبل از هر Deploy. پشتیبان شبانه (دیتابیس، Uploads، `.env`) با نگهداری محدود. **Restore drill خودکار هر شب** روی دیتابیس موقت |
| بازگرداندن دستی و بدون دستورالعمل | `ops/rollback.sh` و Workflow «Rollback production» (یک کلیک در GitHub). `ops/restore.sh` برای فاجعه |
| هیچ پایش یا هشداری نبود | Workflow روزانه: سلامت، گواهی TLS، دیسک، دیتابیس، سن پشتیبان و Restore، Restartها. شکست = ایمیل GitHub |
| ارسال کل Image (حدود ۸۴ مگابایت فشرده) با هر Deploy: ۶۰ تا ۱۲۸ ثانیه | Registry خصوصی روی سرور از طریق تونل SSH: فقط لایه‌های تغییرکرده. Fallback به روش قبلی |
| معلوم نبود `verify` کدام نسخه را آزمایش می‌کند | `/api/health` نسخه (Commit) را گزارش می‌کند. `verify` برابری آن با همین Commit را الزامی می‌کند |
| لاگ Containerها بدون سقف | چرخش لاگ: ۵ × ۱۰ مگابایت |

## 2. Baseline and scope

### Deployment architecture (از فایل‌های واقعی)

```
GitHub main ──push──► .github/workflows/deploy.yml
  check  : npm ci → lint → shellcheck(ops) → typecheck → unit → build(standalone)
           → SEO / security / E2E / DB tests روی Postgres سرویس CI
  deploy : (فقط main و بعد از check سبز)
           buildx (کش GHA) → seodaily:<sha12>
           → deploy/ship.sh ──SSH tunnel──► registry:2 روی 127.0.0.1:5055 سرور (Fallback: docker save | ssh docker load)
           → scp compose و ops/*.sh به $DEPLOY_PATH
           → ops/deploy.sh <sha12>: backup → candidate → switch → health
           → ops/cron.sh (پشتیبان شبانه)، nightly --first-time، status
  verify : نسخه Live = Commit، TLS ≥ ۱۴ روز، Smoke، دامنه‌ها (+UTM)، سئو، امنیت، چیدمان، a11y، Analytics
Server ($DEPLOY_PATH، پیش‌فرض /opt/seodaily):
  docker compose: db (postgres:16-alpine، Volume pgdata) + app (seodaily:latest، 127.0.0.1:3000، Volume uploads)
  entrypoint: migrate.mjs (همه در یک تراکنش) → seed.mjs → server.js (کاربر غیر root)
  nginx → 127.0.0.1:3000 (deploy/nginx-seodaily.ir.conf)، TLS با Let's Encrypt
  .env فقط روی سرور. Secretهای GitHub: DEPLOY_HOST/PORT/USER/PATH/SSH_KEY/KNOWN_HOSTS
```

### بررسی‌شده، بدون مشکل

| موضوع | یافته |
| --- | --- |
| دروازه کیفیت | `deploy` با `needs: check` فقط بعد از Lint، Typecheck، تست‌ها و Build سبز. `npm ci` با Lockfile. کش npm، `.next/cache`، Playwright و لایه‌های Docker (PR #9) |
| Docker | چندمرحله‌ای، اجرا با کاربر `nextjs` (UID 1001)، HEALTHCHECK، `restart: unless-stopped`، Volume برای دیتابیس و Uploads. `.env` در `.dockerignore`. Image حدود ۳۶۳ مگابایت که ۱۷۶ مگابایت آن پایه Node است |
| Secretها | در Git فقط `.env.example` با مقادیر Placeholder. کلید SSH از Secret در فایل `600` و هرگز چاپ نمی‌شود |
| Health | یک `select 1`، بدون جزئیات داخلی، ۵۰۳ در قطع دیتابیس، `no-store` |
| nginx | `nginx -t` روی فایل مخزن (nginx 1.24): **syntax is ok**. یک ریدایرکت برای همه نسخه‌های دامنه با `$request_uri` (Query حفظ می‌شود)، `X-Real-IP` برای محدودیت نرخ، `client_max_body_size 10m` (اپ ۵ مگابایت)، Timeout ۶۰ ثانیه. HSTS و هدرهای امنیتی از اپ |
| Migration | Drizzle همه Migrationهای معلق را در **یک تراکنش** اجرا می‌کند. خطا یعنی هیچ تغییری |

## 3. Confirmed findings

### High

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| OPS-H1 | مرحله «Start the new version» | شبیه‌سازی با همان اسکریپت قدیمی و یک Image با Migration خراب: خروج ۱، **۴۳۲ درخواست ناموفق پشت سر هم**، `app-1 Restarting (1)`. سایت تا دخالت دستی از کار افتاده می‌ماند | `docker compose up -d` کانتینر سالم را متوقف و نسخه آزموده‌نشده را جایگزین می‌کرد. Migration داخل Entrypoint همان کانتینر Live بود. `latest` هم پیش از آزمون به Image جدید اشاره می‌کرد | `ops/deploy.sh`: پشتیبان → Candidate (همان Image، Env، شبکه و Volume، بدون پورت عمومی) → سلامت → جابه‌جایی → سلامت → در صورت خطا برگشت به `seodaily:previous`. `latest` فقط بعد از موفقیت Candidate عوض می‌شود. قفل `flock` در برابر دو Deploy هم‌زمان | شبیه‌سازی (بخش ۴): Migration خراب → خروج ۱، **۱۰/۱۰ درخواست موفق**، `latest` و `deploys.log` دست‌نخورده، Candidate پاک شده | ✅ |
| OPS-H2 | پشتیبان و بازیابی | هیچ کد یا زمان‌بندی پشتیبان‌گیری در مخزن یا Workflow نبود (یافته فاز ۷). از بیرون سرور نمی‌توان دید پشتیبان مستقلی هست یا نه | — | `ops/backup.sh` (دیتابیس `pg_dump -Fc` که با `pg_restore -l` سنجیده می‌شود، Uploads، `.env`، نگهداری محدود، فقط فایل‌های خودش را پاک می‌کند، پوشه ۷۰۰ بیرون از پوشه اپ)، `ops/restore-check.sh` (بازگردانی در `seodaily_restore_check` و مقایسه جدول‌ها و Migrationها و شمارش‌ها با Live، سپس حذف)، `ops/nightly.sh` در crontab (`ops/cron.sh`، فقط بلوک علامت‌دار خودش)، `ops/restore.sh` برای فاجعه | شبیه‌سازی: پشتیبان، Restore check، و فاجعه (حذف Leadها + جدول اضافه) → بازگردانی کامل | ✅ (اولین اجرا روی Production در Deploy همین PR، بخش ۱۳) |

### Medium

| ID | مسیر/ماژول | شواهد | علت | اصلاح | تست | وضعیت |
| --- | --- | --- | --- | --- | --- | --- |
| OPS-M1 | Rollback | تنها راه، دستورهای دستی Docker روی سرور بود. هیچ سندی نبود | — | `ops/rollback.sh [tag]` (بدون Tag: نسخه قبلی از `deploys.log`) با همان بررسی‌های Deploy. Workflow «Rollback production» با ورودی Tag (فقط ۱۲ کاراکتر hex) و Concurrency مشترک با Deploy | شبیه‌سازی: v2→v1 (Tag صریح)، v1→v2 (پیش‌فرض)، Tag ناموجود → خطا، بدون تاریخچه → خطا | ✅ |
| OPS-M2 | پایش | هیچ پایش سلامت، گواهی، دیسک یا پشتیبانی وجود نداشت | — | `ops/status.sh` (سلامت، `pg_isready`، دیسک ≥۸۵٪، پشتیبان و Restore قدیمی‌تر از ۳۰ ساعت، Restartها). Workflow روزانه «Production monitor» (از بیرون: Health و TLS ≥ ۱۴ روز. با SSH: status). شکست = ایمیل GitHub. در `verify` هم TLS بررسی می‌شود | شبیه‌سازی: status همه OK. YAML معتبر | ✅ |
| OPS-M3 | ارسال Image | Deployهای قبلی: «Ship images» بین ۶۳ و ۱۲۸ ثانیه، هر بار کل Image | `docker save \| gzip \| ssh` لایه‌های تکراری را هم می‌فرستد | `deploy/ship.sh`: `registry:2` روی سرور (شبکه Host، فقط `127.0.0.1:5055`، بدون پورت بیرونی)، تونل `ssh -L`، `docker push` (لایه موجود فرستاده نمی‌شود)، سپس `docker pull` محلی روی سرور. سقف ۳ گیگابایت (Registry فقط کش است). هر خطا → روش قبلی. یک اتصال SSH مشترک (`ControlMaster`) برای همه مراحل | شبیه‌سازی: اولین ارسال ۸۴ مگابایت، بعدی‌ها فقط لایه‌های جدید. پورت اشغال → Fallback کامل و موفق | ✅ (زمان واقعی در بخش ۱۳) |
| OPS-M4 | لاگ Docker | `json-file` بدون `max-size` (پیش‌فرض Docker) | — | `x-logging`: ۱۰ مگابایت × ۵ برای app و db. برای db از اولین ساخت دوباره‌اش (عمداً بدون Restart ناخواسته دیتابیس: `--no-recreate`) | Compose معتبر (در شبیه‌سازی اجرا شد) | ✅ |
| OPS-M5 | اثبات نسخه | `verify` سایت را آزمایش می‌کرد، بی‌آنکه بداند Deploy واقعاً عوض شده است | — | `APP_VERSION` (آخرین لایه Image، کش را خراب نمی‌کند) → `/api/health` `version`. گام «The deployed commit is live» | شبیه‌سازی: `{"status":"ok","version":"v2"}` | ✅ |

### Low / informational

- **OPS-L1 `DEPLOY_KNOWN_HOSTS`:** تنظیم نشده. هر Deploy کلید سرور را با `ssh-keyscan` همان لحظه می‌پذیرد. اکنون هشدار می‌دهد. تنظیم آن کار شماست (بخش ۱۴).
- **OPS-L2 هشدار Node 20 در Actions:** GitHub اکشن‌های `checkout@v4`، `setup-node@v4` و `cache@v4` را با Node 24 اجرا می‌کند و همه jobها سبزند. ارتقای نسخه اصلی این اکشن‌ها جدا و بعد از بررسی Changelog آن‌ها انجام شود. چون از اینجا قابل راستی‌آزمایی نبود، تغییری داده نشد.
- **OPS-L3 nginx:** `proxy_set_header Connection "upgrade"` برای همه درخواست‌ها فرستاده می‌شود، در حالی که سایت WebSocket ندارد. بی‌ضرر است و تغییری داده نشد. فایل nginx با Pipeline Deploy نمی‌شود.
- **OPS-L4 مرتب‌سازی پاک‌سازی Imageها:** فقط با تاریخ (بدون ساعت) مرتب می‌شد. اکنون با زمان کامل مرتب می‌شود.
- **پنجره جابه‌جایی:** حدود ۱٫۲ ثانیه 502 هنگام ساخت دوباره Container. حذف کامل آن به دو Upstream در nginx (Blue/Green) نیاز دارد، که برای یک سرور و این ترافیک بیش از نیاز است.

## 4. Reproduction evidence

محیط: sshd روی `127.0.0.1:2222` (نقش سرور، Docker اصلی) و Docker daemon دوم (نقش Runner)، همان اسکریپت‌ها و Compose مخزن.

| سناریو | نتیجه |
| --- | --- |
| **روش قدیمی** + Image با Migration خراب | `exit=1`، Probe هر ۰٫۲ ثانیه: **۴۳۲ × 000، ۱ × 200**، `seodailyprod-app-1 Restarting (1)` |
| ارسال v1 از راه Registry | `shipped seodaily:v1 through the registry`. Registry: ۸۴٫۴ مگابایت، ۵۹ Blob |
| گذار از روش قدیمی (v1 با Compose قدیمی) به روش جدید (v2) | ۸ ثانیه: `database → backup (84K) → candidate: migrations applied → switch → live: v2`. Probe: **۶ × 000 (۱٫۲۵ ثانیه)**، ۸۲ × 200 |
| **روش جدید** + Migration خراب | `ERROR: the new version did not start …; production still runs the previous version`، `exit=1`. Probe: **۱۰ × 200، ۰ خطا**. `latest` = v2، Candidate حذف شده |
| `rollback.sh` بدون تاریخچه / `v1` / پیش‌فرض / Tag ناموجود | خطا / `live: v1` / `live: v2` / `ERROR: seodaily:nosuchtag is not on this server` |
| `nightly.sh --first-time` | Dump ۸۴K، Uploads، سپس `restored: categories,…,users 4 14 1 1 1` = `live: … 4 14 1 1 1` → `restore check passed`. اجرای دوم: بدون کار |
| `status.sh` | همه `OK` (سلامت با نسخه، دیتابیس، دیسک ۳ مسیر، پشتیبان ۰ ساعت، Restore ۰ ساعت) |
| `cron.sh` بدون crontab | `::warning::crontab is not available…`، خروج ۰ |
| فاجعه: `delete from leads` + جدول اضافه → `restore.sh --yes-replace-live-data` | بدون تأیید: خطا. با تأیید: `db-manual-*` ذخیره شد، Lead برگشت، جدول اضافه حذف شد، `restored and healthy` |
| پورت تونل اشغال | `::warning::registry transfer failed; sending the whole image instead` → `Loaded image` |
| `shellcheck -s sh -S warning` | بدون هشدار (یک مورد SC2087 پیدا و اصلاح شد) |
| `nginx -t` | `syntax is ok` |

## 5. Fixes implemented

OPS-H1، OPS-H2، OPS-M1 تا OPS-M5 و OPS-L4 (بخش ۳).

## 6. Files changed

- جدید:
  - `deploy/ops/{lib,deploy,rollback,backup,restore-check,restore,nightly,cron,status}.sh`
  - `deploy/ship.sh`
  - `deploy/RUNBOOK.md`
  - `.github/actions/prod-ssh/action.yml`
  - `.github/workflows/{monitor,rollback}.yml`
- `.github/workflows/deploy.yml`: shellcheck، Build با `APP_VERSION`، ارسال، اسکریپت‌ها، جابه‌جایی، پشتیبان و Status. در `verify`: نسخه و TLS
- `deploy/docker-compose.prod.yml`: `APP_IMAGE_TAG` برای Candidate، چرخش لاگ
- `Dockerfile`: `APP_VERSION` در آخرین لایه
- `src/app/api/health/route.ts`: `version`
- `.env.production.example`: `BACKUP_DIR` اختیاری
- گزارش‌های فاز ۸ و ۹: نتایج Production

## 7. Tests added or updated

- **CI:** `shellcheck` روی همه اسکریپت‌های Deploy.
- **`verify` بعد از هر Deploy:**
  - نسخه Live = Commit
  - گواهی TLS ≥ ۱۴ روز
- **روزانه:** Production monitor.
- **شبیه‌سازی کامل (بخش ۴):** در CI اجرا نمی‌شود، چون به sshd و دو Docker daemon نیاز دارد و دقیقه‌های Actions را مصرف می‌کند. اسکریپت‌هایی که آزمایش کرد همان‌هایی هستند که Deploy اجرا می‌کند.

## 8. Regression results

| بررسی | نتیجه |
| --- | --- |
| Lint / Typecheck / Build | ✅ |
| shellcheck / `sh -n` / nginx -t / YAML | ✅ |
| شبیه‌سازی Deploy (۱۰ سناریو، بخش ۴) | ✅ |
| تست‌های اپ (تنها تغییر اپ: فیلد `version` در Health) | در CI همین PR |

## 9. Git branch and commit SHA(s)

- اصلاحات: `2893e5b` (شاخه `phase-11-devops`)
- Merge در `main`: `668c60d82c11359299f63af616485feaa098d1b4`

## 10. PR

[irancss/seodaily#16](https://github.com/irancss/seodaily/pull/16) — Merge شد.

## 11. CI status

- PR #16 (اجرای `36474443282`): `check` ✅ (شامل shellcheck)
- `main` (اجرای `36475011383`): `check` ✅ · `deploy` ✅ · `verify` ✅

## 12. Deployment status

✅ اولین Deploy با روش جدید، روی سرور واقعی:

```
database → backup before migrations: db-pre-deploy-…dump (84K)
candidate seodaily:668c60d82c11: migrations applied
switch → live: 668c60d82c11          (کل گام: ۹ ثانیه)
nightly backup scheduled: 17 3 * * * … ops/nightly.sh
db-daily-…dump (84K), uploads-….tar.gz
restored: categories,…,users 4 14 0 1 1 = live: … 4 14 0 1 1 → restore check passed
status: app healthy {"version":"668c60d82c11"}، database OK، disk OK (۳ مسیر)، last-success-daily 0h، last-restore-check 0h، restarts 0
```

**ارسال Image:** مسیر Registry روی سرور واقعی شکست خورد و Fallback کل Image را فرستاد (۸۱ ثانیه). Deploy بی‌مشکل ادامه یافت. اسکریپت علت را چاپ نمی‌کرد: هیچ فرمانی خطا نداد، پس شکست به احتمال زیاد در بررسی «دسترسی از تونل» بود. در فاز ۱۲:
- گام شکست‌خورده، خطای curl، لاگ تونل SSH و وضعیت و لاگ Container Registry چاپ می‌شوند.
- Registry که بالا نیاید حذف می‌شود تا در حلقه Restart نماند.
- پورت سمت Runner از 5000 به 15055 منتقل شد.

علت واقعی در لاگ Deploy بعدی دیده می‌شود (FINAL-RELEASE-AUDIT.md).

## 13. Production verification

در job `verify`، همه ✅:
- **The deployed commit is live:** `668c60d82c11`
- **TLS certificate is valid for 14+ days**
- Smoke، نسخه‌های دامنه (+UTM)، سئو، امنیت، چیدمان، دسترس‌پذیری و Analytics

## 14. Remaining manual items

1. **`DEPLOY_KNOWN_HOSTS`:** یک Secret یک‌باره در GitHub (دستور و روش بررسی اثر انگشت در `deploy/RUNBOOK.md`).
2. **کپی پشتیبان خارج از سرور:** پشتیبان‌ها روی همان سرورند و در برابر از دست رفتن کل سرور محافظت نمی‌کنند. یک `rsync` زمان‌بندی‌شده از جای دیگر (دستور در Runbook)، یا فضای ذخیره خارجی که انتخابش با شماست.
3. **تمدید گواهی:** از اینجا دیده نمی‌شود. `verify` و پایش روزانه، زیر ۱۴ روز شکست می‌خورند. `certbot renew --dry-run` را یک بار روی سرور اجرا کنید.
4. **اگر در خروجی Deploy «crontab is not available» دیدید:** `apt install cron`.
