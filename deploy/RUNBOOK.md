# Runbook — seodaily.ir

همه دستورهای سرور در پوشه استقرار اجرا می‌شوند (پیش‌فرض `/opt/seodaily`، مقدار Secret `DEPLOY_PATH`):

```sh
cd /opt/seodaily
```

| چیز | کجا |
| --- | --- |
| Stack | `docker-compose.yml` (از `deploy/docker-compose.prod.yml`)، `.env` (فقط روی سرور، `chmod 600`) |
| اسکریپت‌ها | `ops/*.sh` (از `deploy/ops/`، با هر Deploy به‌روز می‌شوند) |
| نسخه‌ها | `docker images seodaily` (Tag = ۱۲ کاراکتر اول Commit)، تاریخچه در `deploys.log` |
| داده | Volumeهای `<پروژه>_pgdata` (PostgreSQL) و `<پروژه>_uploads` (تصاویر) |
| پشتیبان | `~/seodaily-backups` کاربر Deploy (یا `BACKUP_DIR` در `.env`) |

## Deploy

خودکار: هر Push یا Merge به `main` → `check` (Lint، Typecheck، تست‌ها، Build) → `deploy` → `verify`. اگر `check` شکست بخورد، Deploy اجرا نمی‌شود.

مراحل `deploy` (`deploy/ops/deploy.sh`):

1. Build Image در GitHub، با کش لایه‌ها.
2. ارسال: فقط لایه‌های تغییرکرده، از راه SSH به Registry روی خود سرور (`127.0.0.1:5055`، `deploy/ship.sh`). چون sshd سرور Port forwarding را نمی‌پذیرد، هر اتصال با یک نشست SSH جدا حمل می‌شود (`deploy/registry-proxy.mjs`). اگر این مسیر خطا بدهد، کل Image فرستاده می‌شود.
3. پشتیبان دیتابیس (`db-pre-deploy-*.dump`).
4. **Candidate:** نسخه جدید کنار نسخه فعلی اجرا می‌شود: Migration، Seed، شروع سرور، `/api/health`. در تمام این مدت نسخه قبلی سرویس می‌دهد. **اگر هر کدام شکست بخورد، Deploy همین‌جا متوقف می‌شود و نسخه قبلی Live می‌ماند.**
5. جابه‌جایی: Container دوباره ساخته می‌شود (حدود ۱ تا ۲ ثانیه خطای 502). اگر نسخه جدید سالم بالا نیاید، خودکار به نسخه قبلی برمی‌گردد.
6. `verify`:
   - `/api/health` باید همین Commit را گزارش کند.
   - گواهی TLS حداقل ۱۴ روز اعتبار داشته باشد.
   - Smoke، ریدایرکت‌ها، سئو، امنیت، چیدمان، دسترس‌پذیری و Analytics.

Deploy دستی همان نسخه (مثلاً بعد از تغییر `.env`): `sh ops/deploy.sh <tag>`.

### قانون Migration

Candidate، Migration را **قبل از** جابه‌جایی روی دیتابیس واقعی اجرا می‌کند، در حالی که نسخه قبلی هنوز سرویس می‌دهد. پس Migration باید با نسخه قبلی سازگار باشد:

- فقط **اضافه کنید**: جدول، ستون nullable یا با پیش‌فرض، ایندکس.
- حذف یا تغییر نام را در Deploy بعدی انجام دهید، بعد از اینکه کد دیگر از آن استفاده نمی‌کند.

همه Migrationهای یک Deploy در **یک تراکنش** اجرا می‌شوند (Drizzle). اگر یکی خطا بدهد، هیچ‌کدام اعمال نمی‌شود.

## Verify

```sh
curl -s https://seodaily.ir/api/health       # {"status":"ok","version":"<commit>"}
sh ops/status.sh                              # سلامت، دیتابیس، دیسک، پشتیبان، Restartها
tail -n 5 deploys.log
```

## Rollback

از GitHub: **Actions → Rollback production → Run workflow**. Tag خالی یعنی نسخه قبلی، یا یک Tag از `docker images seodaily` وارد کنید.

روی سرور:

```sh
sh ops/rollback.sh            # نسخه قبل از فعلی (از deploys.log)
sh ops/rollback.sh 0c5f913dccad
```

- Rollback همان بررسی‌های Deploy را دارد: Candidate، سلامت، و بازگشت در صورت خطا.
- **دیتابیس برنمی‌گردد.** با قانون Migration بالا، کد قدیمی با Schema جدید کار می‌کند.
- ۶ نسخه آخر روی سرور نگه داشته می‌شوند.

## Backup

- **خودکار:** هر شب ساعت ۰۳:۱۷ (ساعت سرور) در crontab کاربر Deploy:
  - `ops/nightly.sh` = `backup.sh daily` (دیتابیس، آرشیو Uploads، یک کپی از `.env`)
  - سپس `restore-check.sh`
  - لاگ: `ops/nightly.log`
- **قبل از هر Deploy:** `db-pre-deploy-*.dump`.
- **دستی:** `sh ops/backup.sh manual`.
- **نگهداری:** ۱۴ نسخه شبانه، ۱۰ نسخه قبل از Deploy، ۱۰ نسخه دستی، ۷ آرشیو Uploads. فقط فایل‌های خود اسکریپت پاک می‌شوند.
- **شکست:** اسکریپت با خطا خارج می‌شود و `.last-failure` را می‌نویسد. `status.sh` و Workflow روزانه «Production monitor» اگر پشتیبان شبانه یا Restore check بیش از ۳۰ ساعت قدیمی باشد، شکست می‌خورند و GitHub ایمیل می‌فرستد.
- **کپی خارج از سرور** (لازم، چون همه پشتیبان‌ها روی همین دیسک‌اند). مثلاً از کامپیوتر خودتان:
  ```sh
  rsync -a --delete deploy-user@server:seodaily-backups/ ./seodaily-backups/
  ```

## Restore

**آزمون بدون خطر** (دیتابیس موقت کنار دیتابیس اصلی، که بعد حذف می‌شود):

```sh
sh ops/restore-check.sh                                   # جدیدترین
sh ops/restore-check.sh ~/seodaily-backups/db-daily-….dump
```

**بازگردانی واقعی** (Migration خراب، یا داده حذف یا خراب شده). هر چیزی که بعد از زمان پشتیبان ثبت شده از بین می‌رود. اسکریپت قبل از شروع، وضعیت فعلی را در `db-manual-*` ذخیره می‌کند.

```sh
ls -lt ~/seodaily-backups/
sh ops/restore.sh --yes-replace-live-data ~/seodaily-backups/db-pre-deploy-….dump
# با تصاویر:
sh ops/restore.sh --yes-replace-live-data ~/seodaily-backups/db-daily-….dump ~/seodaily-backups/uploads-….tar.gz
# اگر پشتیبان قبل از یک Migration است، نسخه هم‌زمان با آن را Live کنید:
sh ops/rollback.sh <tag>
```

**سرور کاملاً از دست رفته:**

1. روی سرور جدید Docker و nginx نصب کنید و `.env` را از `env.latest` پشتیبان برگردانید.
2. Secretهای `DEPLOY_*` را در GitHub به‌روز کنید و Workflow «CI / Deploy» را روی `main` دستی اجرا کنید.
3. سپس `restore.sh` را با آخرین پشتیبان اجرا کنید.

## Logs

```sh
docker compose logs --since 1h app          # شروع، Migration، خطاهای Runtime
docker compose logs --tail 100 db
tail -n 50 ops/nightly.log                  # پشتیبان و Restore check
grep -i error /var/log/nginx/error.log | tail
```

- لاگ Containerها با چرخش است: ۵ فایل ۱۰ مگابایتی.
- برای Container دیتابیس، این تنظیم از اولین ساخت دوباره‌اش اعمال می‌شود (مثلاً `docker compose up -d db` در زمان کم‌بازدید).
- لاگ‌ها داده شخصی و Secret ندارند.

## Health

- `/api/health`: یک `select 1` (ارزان). ۲۰۰ و `{"status":"ok","version":…}`، یا ۵۰۳ اگر دیتابیس در دسترس نباشد.
- HEALTHCHECK داخلی Docker هر ۳۰ ثانیه همین را صدا می‌زند.
- با `restart: unless-stopped`، اگر پردازه از کار بیفتد Docker آن را دوباره اجرا می‌کند. وضعیت «unhealthy» به‌تنهایی باعث Restart نمی‌شود. `status.sh` و Workflow روزانه آن را گزارش می‌کنند.

## Common failures

| نشانه | کار |
| --- | --- |
| Deploy: «the new version did not start» | نسخه قبلی Live است. لاگ Candidate در خروجی Action هست (معمولاً Migration یا متغیر محیطی). اصلاح کنید و دوباره Push کنید |
| Deploy: «new version unhealthy: back to the previous image» | همان. نسخه قبلی خودکار برگشته است |
| Deploy: «another deploy is running» | Deploy قبلی هنوز روی سرور است. بعد از اتمام دوباره اجرا کنید |
| هشدار «registry transfer failed» | Deploy با ارسال کامل Image ادامه پیدا کرده. `docker logs seodaily-registry` |
| سایت 502 | `docker compose ps` و `docker compose logs --tail 100 app`. در صورت نیاز `sh ops/rollback.sh` |
| سلامت 503 (دیتابیس) | `docker compose ps db`، `docker compose logs --tail 50 db`، `df -h` |
| دیسک پر | `docker system df`. سپس `docker image prune -f` و `docker builder prune -f`. پشتیبان‌ها و Volumeها را دستی پاک نکنید |
| «crontab is not available» در Deploy | `apt install cron` (Debian/Ubuntu)، سپس Deploy بعدی زمان‌بندی را نصب می‌کند |
| گواهی نزدیک انقضا | `certbot renew --dry-run`، سپس `systemctl status certbot.timer` یا `crontab -l` کاربر root |

## First-time / one-off server items

- **`DEPLOY_KNOWN_HOSTS`:** بدون آن، هر Deploy کلید سرور را همان لحظه می‌پذیرد (خطر حمله میانی). یک بار اجرا کنید و خروجی را در Secret `DEPLOY_KNOWN_HOSTS` بگذارید:
  ```sh
  ssh-keyscan -p <port> <host>
  ```
  قبل از ذخیره، اثر انگشت را مقایسه کنید. خروجی `ssh-keyscan -p <port> <host> | ssh-keygen -lf -` باید با `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` روی خود سرور یکی باشد.
- **Workflow «Production monitor»:** هر روز یک بار اجرا می‌شود (حدود ۱ دقیقه از سهمیه Actions). برای خاموش‌کردن: Actions → Production monitor → Disable workflow.
