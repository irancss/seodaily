# سئو دیلی — وب‌سایت و پنل مدیریت

وب‌سایت «سئو دیلی» (طراحی سایت و سئو) به‌همراه پنل مدیریت فارسی برای ویرایش همه محتوای سایت، بدون نیاز به کدنویسی. طراحی از روی بوم طراحی «سئو دیلی» پیاده‌سازی شده است (۸ صفحه: خانه، خدمات، طراحی سایت، سئو، قالب زیرخدمت، نمونه‌کارها، درباره ما، تماس).

**فناوری‌ها:** Next.js 16 (App Router، React 19، Tailwind CSS v4)، PostgreSQL 16، Drizzle ORM، zod، jose (کوکی نشست JWT)، bcryptjs، فونت وزیر (Vazir FD-WOL، مجوز OFL). کل پروژه با Docker Compose اجرا می‌شود.

## فهرست

- [امکانات](#امکانات)
- [پیش‌نیازها](#پیشنیازها)
- [راه‌اندازی سریع با Docker](#راهاندازی-سریع-با-docker)
- [متغیرهای محیطی](#متغیرهای-محیطی)
- [راهنمای پنل مدیریت](#راهنمای-پنل-مدیریت)
- [سئو و پرفورمنس](#سئو-و-پرفورمنس)
- [استقرار روی سرور](#استقرار-روی-سرور)
- [پشتیبان‌گیری و بازیابی](#پشتیبانگیری-و-بازیابی)
- [توسعه محلی بدون Docker](#توسعه-محلی-بدون-docker)
- [ساختار پروژه](#ساختار-پروژه)
- [عیب‌یابی](#عیبیابی)

---

## امکانات

### سایت عمومی

| مسیر | صفحه |
| --- | --- |
| `/` | صفحه اصلی |
| `/services` | خدمات (هر دو خدمت اصلی و زیرخدمت‌ها) |
| `/services/[slug]` | صفحه هر زیرخدمت (قالب زیرخدمت) |
| `/web-design` و `/seo` | صفحه‌های دو خدمت اصلی |
| `/pricing` | تعرفه‌ها و ماشین‌حساب هزینه طراحی سایت، سئو و تولید محتوا (با ثبت درخواست پیش‌فاکتور) |
| `/portfolio` و `/portfolio/[slug]` | نمونه‌کارها (با فیلتر نوع پروژه) و صفحه هر پروژه |
| `/about` | درباره ما (به‌همراه اعضای تیم) |
| `/contact` | تماس و فرم درخواست مشاوره |
| `/sitemap.xml` و `/robots.txt` | نقشه سایت و فایل robots (خودکار) |
| `/api/health` | بررسی سلامت برنامه و اتصال دیتابیس |
| `/uploads/*` | تصاویری که از پنل آپلود شده‌اند |

- فرم درخواست مشاوره با اعتبارسنجی سمت سرور (zod)، تبدیل خودکار ارقام فارسی/عربی شماره تلفن، فیلد مخفی ضدربات و محدودیت تعداد ارسال (۵ درخواست در ۱۰ دقیقه برای هر IP).
- درخواست‌ها در پنل ذخیره و نمایش داده می‌شوند (ارسال ایمیل اطلاع‌رسانی پیاده‌سازی نشده است).
- نامک (slug) فارسی در آدرس‌ها پشتیبانی می‌شود، مثلاً `/portfolio/فروشگاه-نمونه`.
- **ماشین‌حساب هزینه:** بازدیدکننده گزینه‌ها (نوع سایت، تعداد صفحات، کلمات کلیدی، تعداد و طول مقاله و …) یا یکی از پکیج‌ها را انتخاب می‌کند و جمع هزینه همان لحظه محاسبه می‌شود. قیمت‌ها از پنل وارد می‌شوند؛ قیمت صفر «توافقی» نمایش داده می‌شود. هنگام ثبت، سرور جمع را دوباره از روی قیمت‌های ذخیره‌شده حساب می‌کند (دست‌کاری مبلغ در مرورگر اثری ندارد) و برآورد همراه درخواست در پنل ذخیره می‌شود.
- **طراحی و انیمیشن:** هدرهای تیره با نور گرادیانی، کارت‌های بنتو، تایم‌لاین فرایند، نوار متحرک خدمات، شمارنده‌ها و ظاهر شدن تدریجی بخش‌ها هنگام اسکرول — همه فقط با CSS (بدون کتابخانه جاوااسکریپت) و فقط با `transform`/`opacity`. برای کاربرانی که در سیستم‌عامل «کاهش حرکت» را فعال کرده‌اند، همه انیمیشن‌ها خاموش می‌شوند.
- **منو:** منوی دسکتاپ تو در تو (تا سه سطح) و منوی کشویی موبایل که از سمت راست باز می‌شود؛ هر دو از پنل قابل چیدن‌اند. در موبایل دکمه شناور تماس تلفنی هم نمایش داده می‌شود.
- **پیام‌ها (Toast):** نتیجه فرم‌ها و ذخیره‌ها در پنل با پیام شناور نمایش داده می‌شود (برای صفحه‌خوان‌ها هم اعلام می‌شود).
- یک کلمه از عنوان‌ها را می‌توان رنگی (گرادیانی) کرد: کافی است در پنل آن را بین دو ستاره بنویسید، مثلاً `حضور آنلاین کسب‌وکارت را *اصولی* بساز`. ستاره‌ها در عنوان سئو و داده‌های ساختاریافته حذف می‌شوند.

### پنل مدیریت (`/admin`)

داشبورد، درخواست‌های مشاوره (همراه با برآورد هزینه و قرارداد قابل چاپ)، خدمات و زیرخدمات، نمونه‌کارها، سؤال‌های متداول، تیم، تعرفه و ماشین‌حساب، قالب قرارداد، منوی سایت، متن و سئوی صفحات، تنظیمات سایت و حساب کاربری. جزئیات در بخش [راهنمای پنل مدیریت](#راهنمای-پنل-مدیریت) آمده است.

### سئو

عنوان و توضیحات متای قابل ویرایش برای هر صفحه، canonical، Open Graph و Twitter Card، داده‌های ساختاریافته JSON-LD، نقشه سایت و robots خودکار و `noindex` برای پنل مدیریت.

### پرفورمنس

رندر سمت سرور (Server Components)، انیمیشن‌های فقط-CSS، بارگذاری تنبل تصاویر پایین صفحه، کش داده‌ها با پاک‌شدن فوری بعد از هر ذخیره در پنل، فونت‌های محلی با preload و کش یک‌ساله، و ایمیج Docker سبک (standalone، حدود ۳۶۰ مگابایت).

---

## پیش‌نیازها

- **Docker** و **Docker Compose v2** (دستور `docker compose` با فاصله، نه `docker-compose`).
  - ویندوز و مک: [Docker Desktop](https://www.docker.com/products/docker-desktop/) را نصب و اجرا کنید (روی ویندوز با WSL 2).
  - لینوکس: Docker Engine به‌همراه افزونه Compose.
- **Git** برای دریافت و به‌روزرسانی کد.
- برای توسعه بدون Docker: Node.js 22 و PostgreSQL 16 ([این بخش](#توسعه-محلی-بدون-docker)).

---

## راه‌اندازی سریع با Docker

### روش یک‌دستوری ویندوز (پیشنهادی)

با Git و Docker Desktop نصب‌شده و روشن، در PowerShell:

```powershell
git clone --config core.autocrlf=false https://github.com/irancss/seodaily.git C:\cloude\seodaily
powershell -ExecutionPolicy Bypass -File C:\cloude\seodaily\scripts\windows\setup.ps1
```

اسکریپت `scripts/windows/setup.ps1`:

- از کد موجود در `C:\cloude\seodaily` استفاده می‌کند و از GitHub به‌صورت خودکار دریافت نمی‌کند؛
- بار اول `.env` را با رمزهای تصادفی می‌سازد و **ایمیل و رمز مدیر را نمایش می‌دهد**؛
- سایت را با Docker بالا می‌آورد، تا سالم شدن صبر می‌کند و مرورگر را باز می‌کند؛
- هر بار که آن را دستی اجرا کنید، برنامه را از سورس همین فولدر build می‌کند.

این فولدر منبع اصلی کار است: تغییرات را همین‌جا انجام دهید، با Git ثبت کنید و با `git push origin main` به GitHub بفرستید. `setup.ps1` دیگر سورس را از GitHub همگام نمی‌کند و تسک زمان‌بندی‌شده نمی‌سازد. برای اجرای دوبارهٔ نسخهٔ محلی، همان دستور بالا را دستی اجرا کنید. اگر Docker Hub در دسترس نیست (مثلاً از ایران)، ‏`-Mirror docker.arvancloud.ir` را اضافه کنید. اگر پورت ۳۰۰۰ اشغال است، ‏`-Port 3001`.

### روش دستی

### ۱. دریافت کد

ویندوز (PowerShell):

```powershell
mkdir C:\cloude -Force
cd C:\cloude
git clone --config core.autocrlf=false https://github.com/irancss/seodaily.git
cd seodaily
```

> گزینه `core.autocrlf=false` مهم است: اگر Git در ویندوز انتهای خط فایل `docker/entrypoint.sh` را به CRLF تبدیل کند، کانتینر برنامه اجرا نمی‌شود ([عیب‌یابی](#عیبیابی)).

لینوکس / مک:

```bash
git clone https://github.com/irancss/seodaily.git
cd seodaily
```

### ۲. ساخت فایل `.env`

ویندوز (PowerShell):

```powershell
Copy-Item .env.example .env
```

لینوکس / مک:

```bash
cp .env.example .env
```

### ۳. ساخت کلید نشست (`SESSION_SECRET`)

یک رشته تصادفی بسازید و در `.env` جلوی `SESSION_SECRET=` بگذارید.

ویندوز (PowerShell):

```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

لینوکس / مک:

```bash
openssl rand -base64 48
```

### ۴. تکمیل `.env`

فایل `.env` را با یک ویرایشگر متن (مثلاً Notepad یا VS Code) باز کنید و دست‌کم این مقادیر را پر کنید:

```ini
POSTGRES_PASSWORD=YourStrongDbPassword123
SESSION_SECRET=<خروجی مرحله قبل>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<حداقل ۸ کاراکتر>
```

> - در `POSTGRES_PASSWORD` فقط از حروف انگلیسی و عدد استفاده کنید؛ این رمز داخل آدرس اتصال دیتابیس قرار می‌گیرد و کاراکترهایی مثل `@ : / # ?` آن را خراب می‌کنند.
> - اگر در رمزها کاراکتر `$` دارید، مقدار را داخل `'...'` بگذارید.

### ۵. اجرا

```bash
docker compose up -d --build
```

بار اول ساخت ایمیج چند دقیقه طول می‌کشد. هنگام بالا آمدن کانتینر برنامه، به‌ترتیب این کارها خودکار انجام می‌شود:

1. اعمال مایگریشن‌های دیتابیس (فقط مایگریشن‌های جدید).
2. ساخت اولین مدیر از روی `ADMIN_EMAIL` و `ADMIN_PASSWORD`، فقط اگر هنوز هیچ کاربری وجود نداشته باشد.
3. پر کردن محتوای اولیه طرح (دو خدمت اصلی، ۱۴ زیرخدمت و سؤال‌های متداول) فقط در جدول‌هایی که خالی‌اند؛ داده موجود هیچ‌وقت بازنویسی نمی‌شود. نمونه‌کارها و تیم خالی شروع می‌شوند.

وضعیت و لاگ‌ها:

```bash
docker compose ps
docker compose logs -f app
```

### ۶. باز کردن سایت

- سایت: <http://localhost:3000>
- پنل مدیریت: <http://localhost:3000/admin> (ورود با `ADMIN_EMAIL` و `ADMIN_PASSWORD`)

بعد از اولین ورود، از بخش «حساب کاربری» رمز عبور را عوض کنید. مقدار `ADMIN_PASSWORD` در `.env` پس از ساخته‌شدن مدیر دیگر استفاده نمی‌شود.

دستورهای پرکاربرد:

```bash
docker compose stop        # توقف
docker compose start       # اجرای دوباره
docker compose restart app # راه‌اندازی مجدد فقط برنامه
docker compose down        # حذف کانتینرها (داده‌ها در volume‌ها می‌مانند)
```

> `docker compose down -v` volume‌ها را هم پاک می‌کند، یعنی **کل دیتابیس و تصاویر آپلودشده حذف می‌شوند**.

---

## متغیرهای محیطی

همه در فایل `.env` کنار `docker-compose.yml` تعریف می‌شوند (الگو: `.env.example`). فایل `.env` را هرگز commit نکنید.

| متغیر | اجباری | پیش‌فرض | توضیح |
| --- | --- | --- | --- |
| `POSTGRES_DB` | خیر | `seodaily` | نام دیتابیس |
| `POSTGRES_USER` | خیر | `seodaily` | کاربر دیتابیس |
| `POSTGRES_PASSWORD` | **بله** | — | رمز دیتابیس؛ فقط هنگام اولین ساخت volume دیتابیس اعمال می‌شود |
| `SESSION_SECRET` | **بله** | — | کلید امضای کوکی ورود؛ حداقل ۳۲ کاراکتر تصادفی. تغییرش همه را از پنل خارج می‌کند |
| `ADMIN_EMAIL` | بار اول | — | ایمیل اولین مدیر |
| `ADMIN_PASSWORD` | بار اول | — | رمز اولین مدیر (حداقل ۸ کاراکتر)؛ فقط وقتی هیچ کاربری نیست استفاده می‌شود |
| `SITE_URL` | خیر | `http://localhost:3000` | آدرس عمومی سایت برای canonical، نقشه سایت و Open Graph. «آدرس اصلی سایت» در تنظیمات پنل بر این مقدار اولویت دارد |
| `COOKIE_SECURE` | خیر | `false` | وقتی سایت روی HTTPS است `true` کنید (کوکی ورود فقط روی HTTPS ارسال می‌شود) |
| `APP_PORT` | خیر | `3000` | پورتی از سیستم میزبان که سایت روی آن باز می‌شود |
| `DATABASE_URL` | فقط بدون Docker | — | در Docker خودکار از متغیرهای بالا ساخته می‌شود؛ برای توسعه محلی لازم است |

`UPLOAD_DIR` (محل ذخیره تصاویر) داخل ایمیج روی `/app/uploads` تنظیم شده و در حالت توسعه به‌طور پیش‌فرض پوشه `uploads/` پروژه است.

---

## راهنمای پنل مدیریت

آدرس: `/admin` (صفحه ورود: `/admin/login`). نشست ورود ۷ روز معتبر است. بعد از ۸ تلاش ناموفق برای یک ایمیل، ورود با آن ایمیل ۱۵ دقیقه مسدود می‌شود. همه صفحات پنل `noindex` هستند و در robots.txt بسته شده‌اند.

هر تغییری که در پنل ذخیره شود **بلافاصله** روی سایت دیده می‌شود و نیازی به build دوباره نیست.

| بخش | کاربرد |
| --- | --- |
| **داشبورد** | تعداد درخواست‌های جدید و کل، تعداد زیرخدمات و نمونه‌کارها، آخرین درخواست‌ها و میان‌بر افزودن نمونه‌کار، زیرخدمت و ویرایش متای صفحات |
| **درخواست‌های مشاوره** | فهرست فرم‌های ارسالی از صفحه تماس و ماشین‌حساب هزینه با فیلتر وضعیت؛ در صفحه هر درخواست می‌توانید وضعیت (جدید، در حال پیگیری، انجام‌شده، بایگانی) و یادداشت داخلی ثبت کنید، ردیف‌های برآورد هزینه را ویرایش کنید، **نسخه قرارداد** را با اطلاعات مشتری و جدول هزینه ببینید و چاپ یا PDF کنید، یا درخواست را حذف کنید. تعداد درخواست‌های جدید کنار منو نمایش داده می‌شود |
| **خدمات و زیرخدمات** | ویرایش عنوان و توضیح دو خدمت اصلی (طراحی سایت و سئو؛ خودِ این دو ثابت‌اند) و افزودن/ویرایش/حذف زیرخدمت‌ها با کل محتوای قالب زیرخدمت: خلاصه، توضیح بالای صفحه، تصویر، مشکل‌هایی که حل می‌کند، موارد شامل، مراحل اجرا، مناسب چه کسب‌وکارهایی است، خروجی‌های تحویلی، سؤال‌های متداول، خدمات مرتبط، عنوان و توضیحات متا، آیکون، ترتیب و وضعیت انتشار |
| **نمونه‌کارها** | افزودن پروژه با تصویر، نوع پروژه (برای فیلتر صفحه نمونه‌کارها)، خدمت مرتبط، آدرس سایت، توضیح کوتاه و کامل، «ویژه» (اول نمایش داده شود) و «مطالعه موردی» (مسئله، راهکار، نتیجه) |
| **سؤال‌های متداول** | سؤال و پاسخ‌های صفحات اصلی، خدمات، طراحی سایت و سئو (سؤال‌های هر زیرخدمت در فرم همان زیرخدمت‌اند) |
| **تیم** | اعضای تیم با نقش، معرفی کوتاه و عکس برای صفحه درباره ما |
| **تعرفه و ماشین‌حساب** | برای هر خدمت (طراحی سایت، سئو، تولید محتوا): پکیج‌ها (نام، قیمت، دوره، ویژگی‌ها، «پیشنهادی») و گروه گزینه‌های ماشین‌حساب (تک‌انتخابی، چندانتخابی یا تعدادی؛ قیمت هر گزینه، الزامی بودن، حداقل و حداکثر تعداد و قیمت «به ازای هر واحد»)، به‌همراه توضیح و یادداشت زیر جمع (مثلاً مالیات) |
| **قالب قرارداد** | اطلاعات شرکت (نام، آدرس، تلفن، امضاکننده، شناسه ملی، شماره ثبت) و متن قرارداد هر خدمت با جای‌گذاری خودکار مشخصات مشتری، جدول هزینه و مبلغ به عدد و حروف. متن‌های پیش‌فرض نمونه‌اند و باید با مشاور حقوقی بازبینی شوند |
| **منوی سایت** | چیدن جداگانه منوی دسکتاپ و موبایل، تا سه سطح تو در تو: افزودن، حذف، جابه‌جایی بالا/پایین، زیرمنو کردن و خارج کردن از زیرمنو، باز شدن در تب جدید، پیشنهاد آدرس صفحات و کپی یک منو در دیگری. آیتمی که زیرمنو دارد می‌تواند بدون لینک باشد. دکمه «بازگشت به منوی پیش‌فرض» هم هست |
| **متن و سئوی صفحات** | برای ۸ صفحه ثابت (خانه، خدمات، طراحی سایت، سئو، تعرفه‌ها، نمونه‌کارها، درباره ما، تماس): عنوان سئو، توضیحات متا، برچسب، عنوان اصلی (H1)، زیرعنوان و متن بخش دعوت به اقدام، همراه با پیش‌نمایش نتیجه گوگل |
| **تنظیمات سایت** | اطلاعات تماس (تلفن و موبایل — در هدر، فوتر، دکمه تماس موبایل و بخش‌های دعوت به اقدام؛ اگر خالی بماند ۰۹۱۲۴۶۰۷۶۳۰ نمایش داده می‌شود —، ایمیل، آدرس، شبکه‌های اجتماعی)، نام سایت، آدرس اصلی سایت، کد تأیید Google Search Console، تصویر پیش‌فرض Open Graph، متن‌های فوتر، صنف‌های صفحه اصلی، بازه‌های بودجه فرم مشاوره (اگر خالی باشد فیلد بودجه نمایش داده نمی‌شود) و گزینه‌های فناوری صفحه طراحی سایت |
| **حساب کاربری** | تغییر نام، ایمیل و رمز عبور (با تأیید رمز فعلی) |

### ویرایش عنوان و توضیحات متا

- **صفحات ثابت** («متن و سئوی صفحات»): هر فیلدی که **خالی** بماند، متن پیش‌فرض طرح نمایش داده می‌شود؛ پیش‌فرض‌ها به‌صورت placeholder داخل فیلدها دیده می‌شوند. پس برای برگشت به متن طرح کافی است فیلد را خالی و ذخیره کنید. شمارنده کاراکتر، محدوده پیشنهادی (عنوان تا ۶۰ و توضیحات تا ۱۶۰ کاراکتر) را نشان می‌دهد.
- **زیرخدمت‌ها:** اگر عنوان و توضیحات متا خالی باشند، عنوان و خلاصه خدمت استفاده می‌شود.
- **نمونه‌کارها:** توضیح کوتاه پروژه به‌عنوان توضیحات متا استفاده می‌شود.
- اگر عنوان سئو نام سایت را نداشته باشد، « | سئو دیلی» به انتهای آن اضافه می‌شود؛ اگر داشته باشد، همان‌طور که نوشته‌اید استفاده می‌شود.

### نامک (slug) و تصاویر

- اگر نامک را خالی بگذارید، از روی عنوان ساخته می‌شود. حروف فارسی مجازند و فاصله‌ها به `-` تبدیل می‌شوند.
- تصاویر: JPG، PNG، WebP، AVIF یا GIF، حداکثر ۵ مگابایت. نوع فایل از روی محتوای آن بررسی می‌شود (تغییر پسوند کافی نیست). با جایگزینی یا حذف تصویر، فایل قبلی هم پاک می‌شود.

---

## سئو و پرفورمنس

### آنچه پیاده‌سازی شده

- **متا:** عنوان و توضیحات هر صفحه از پنل، آدرس canonical، تگ‌های Open Graph (با `fa_IR`) و Twitter Card؛ اگر صفحه تصویر خودش را نداشته باشد، تصویر پیش‌فرض Open Graph از تنظیمات استفاده می‌شود.
- **داده‌های ساختاریافته (JSON-LD):** `ProfessionalService` و `WebSite` در همه صفحات؛ `Service` برای خدمات؛ `BreadcrumbList`؛ `FAQPage` در صفحاتی که سؤال متداول دارند؛ `CreativeWork` برای هر نمونه‌کار؛ `CollectionPage` برای نمونه‌کارها؛ `AboutPage` و `ContactPage`.
- **`/sitemap.xml`:** صفحات ثابت به‌همراه همه زیرخدمت‌ها و نمونه‌کارهای منتشرشده (با تاریخ آخرین تغییر). موارد منتشرنشده در آن نیستند.
- **`/robots.txt`:** همه‌چیز مجاز به‌جز `/admin`، همراه با آدرس نقشه سایت. پنل هم هدر `X-Robots-Tag: noindex` دارد.
- **آدرس‌های فارسی:** نامک‌های فارسی (UTF-8) در صفحات، canonical و نقشه سایت درست کار می‌کنند.
- **HTML معنایی و RTL** با `lang="fa-IR"`.

### پرفورمنس

- صفحات با React Server Components روی سرور رندر می‌شوند و جاوااسکریپت سمت کاربر حداقلی است (حدود ۱۵۰ کیلوبایت فشرده در هر صفحه).
- همه انیمیشن‌ها با CSS و فقط روی `transform`/`opacity` اجرا می‌شوند؛ ظاهر شدن بخش‌ها هنگام اسکرول با scroll-driven animations مرورگر است و هیچ اسکریپتی ندارد. عنوان و زیرعنوان بالای صفحه بدون محو شدن وارد می‌شوند تا LCP عقب نیفتد. در تست آزمایشگاهی موبایل (CPU چهار برابر کندتر و اینترنت 4G کند)، LCP صفحات حدود ۱٫۱ تا ۱٫۳ ثانیه و CLS صفر بود.
- تصاویر پایین صفحه تنبل (lazy) بارگذاری می‌شوند و تصویر بالای صفحه با اولویت بالا.
- خواندن‌های دیتابیس در Data Cache خود Next.js با تگ کش می‌شوند و با هر ذخیره در پنل فوراً باطل می‌شوند (برای احتیاط، حداکثر عمر کش یک ساعت است).
- فونت وزیر روی خود سایت میزبانی می‌شود؛ وزن‌های اصلی preload می‌شوند و با کش یک‌ساله (`immutable`) ارسال می‌شوند.
- تصاویر آپلودی با نام تصادفی و یکتا ذخیره و با کش یک‌ساله `immutable` ارائه می‌شوند.
- فشرده‌سازی gzip، هدرهای امنیتی (`X-Content-Type-Options`، `X-Frame-Options`، `Referrer-Policy`، `Permissions-Policy`) و ایمیج standalone حدود ۳۶۰ مگابایتی.

### بعد از آنلاین شدن سایت

1. در **تنظیمات سایت ← آدرس اصلی سایت** آدرس نهایی را وارد کنید (مثلاً `https://example.com`، بدون `/` انتهایی). canonical، نقشه سایت، robots و Open Graph از این مقدار ساخته می‌شوند.
2. در [Google Search Console](https://search.google.com/search-console) سایت را با روش «HTML tag» اضافه کنید و مقدار `content` تگ (یا کل تگ `<meta name="google-site-verification" ...>`) را در فیلد «کد تأیید Google Search Console» بچسبانید، ذخیره کنید و در Search Console دکمه Verify را بزنید.
3. در Search Console، بخش Sitemaps، آدرس `sitemap.xml` را ثبت کنید.
4. یک تصویر پیش‌فرض Open Graph (۱۲۰۰×۶۳۰) آپلود کنید و اطلاعات تماس و شبکه‌های اجتماعی را کامل کنید (در Schema هم استفاده می‌شوند).
5. عنوان و توضیحات متای صفحات را در «متن و سئوی صفحات» بازبینی کنید.

---

## استقرار روی سرور

با هر push روی شاخه `main`، ‏GitHub Actions (فایل `.github/workflows/deploy.yml`) این کارها را انجام می‌دهد:

1. lint، typecheck و build را اجرا می‌کند؛ اگر خطا باشد چیزی روی سرور عوض نمی‌شود.
2. ایمیج Docker را **روی سرورهای GitHub** می‌سازد و از طریق SSH به سرور شما می‌فرستد. سرور به Docker Hub یا npm نیازی ندارد، که برای سرورهای داخل ایران مهم است.
3. فایل `deploy/docker-compose.prod.yml` را در `/opt/seodaily/docker-compose.yml` کپی می‌کند، نسخهٔ جدید را بالا می‌آورد و تا سالم شدن `/api/health` صبر می‌کند.
4. پنج نسخهٔ آخر را برای بازگشت نگه می‌دارد.

برنامه فقط روی `127.0.0.1:3000` سرور گوش می‌دهد و وب‌سرور فعلی شما (nginx یا Apache) دامنه را به آن می‌فرستد، پس سایت‌های دیگر سرور دست نمی‌خورند.

### ۱) روی سرور: نصب Docker

```bash
docker --version && docker compose version
```

اگر نصب نیست (در سرورهای ایران `download.docker.com` معمولاً مسدود است؛ از بسته‌های اوبونتو استفاده کنید):

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
```

### ۲) روی سرور: کاربر deploy و کلید SSH

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo mkdir -p /opt/seodaily && sudo chown deploy:deploy /opt/seodaily

# یک کلید مخصوص GitHub Actions بسازید
sudo -u deploy ssh-keygen -t ed25519 -N "" -f /home/deploy/.ssh/github_actions -C "github-actions"
sudo -u deploy sh -c 'cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

# این خروجی را کپی کنید (برای مرحله ۴) و بعد فایل کلید خصوصی را پاک کنید
sudo cat /home/deploy/.ssh/github_actions
sudo rm /home/deploy/.ssh/github_actions

# برای مرحله ۴ (اثر انگشت سرور)
ssh-keyscan -p 22 localhost 2>/dev/null | sed "s/^localhost/YOUR_SERVER_IP/"
```

در دستور آخر `YOUR_SERVER_IP` را با IP یا دامنهٔ سرور عوض کنید (همان مقداری که در `DEPLOY_HOST` می‌گذارید). اگر SSH روی پورت دیگری است، `-p 22` را عوض کنید.

### ۳) روی سرور: فایل `.env`

```bash
sudo -u deploy nano /opt/seodaily/.env
sudo chmod 600 /opt/seodaily/.env
```

محتوا را از `.env.production.example` بردارید و پر کنید (`SESSION_SECRET` با `openssl rand -base64 48`، رمز دیتابیس فقط حروف و عدد، `SITE_URL=https://seodaily.ir`). اگر پورت ۳۰۰۰ روی سرور اشغال است، `APP_PORT` را عوض کنید و همان را در تنظیم وب‌سرور بگذارید.

### ۴) در GitHub: تعریف Secretها

در `github.com/irancss/seodaily` ← **Settings ← Secrets and variables ← Actions ← New repository secret**:

| نام | مقدار |
| --- | --- |
| `DEPLOY_HOST` | IP یا دامنهٔ سرور |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | کل کلید خصوصی مرحله ۲ (از `-----BEGIN` تا `END-----`) |
| `DEPLOY_KNOWN_HOSTS` | خروجی دستور `ssh-keyscan` مرحله ۲ (پیشنهادی) |
| `DEPLOY_PORT` | فقط اگر SSH روی پورتی غیر از ۲۲ است |
| `DEPLOY_PATH` | فقط اگر مسیری غیر از `/opt/seodaily` می‌خواهید |

تا وقتی این Secretها تعریف نشده‌اند، مرحلهٔ deploy با یک هشدار رد می‌شود و خطا نمی‌دهد.

### ۵) اولین استقرار

در GitHub ← **Actions ← CI / Deploy ← Run workflow** (یا یک push روی `main`). بعد از سبز شدن، روی سرور:

```bash
curl -I http://127.0.0.1:3000
cd /opt/seodaily && docker compose ps
```

### ۶) پشتیبان از وردپرس فعلی (قبل از حذف)

```bash
mkdir -p ~/wp-backup && cd ~/wp-backup
# مسیر و نام دیتابیس را از wp-config.php بردارید
sudo tar czf wp-files.tgz -C /var/www seodaily.ir
mysqldump -u root -p WORDPRESS_DB_NAME > wp-db.sql
```

### ۷) وصل کردن دامنه به نسخهٔ جدید

آدرس اصلی (Canonical) سایت `https://seodaily.ir` (بدون www) است. فایل‌های `deploy/` طوری نوشته شده‌اند که سه نسخه دیگر (`http://seodaily.ir`، `http://www.seodaily.ir` و `https://www.seodaily.ir`) فقط با **یک** ریدایرکت دائمی (301) و با حفظ مسیر صفحه به همین آدرس برسند؛ زنجیره ریدایرکت ساخته نمی‌شود.

**گواهی SSL** باید هر دو نام را پوشش دهد. اگر هنوز ندارید (یا گواهی فعلی فقط یکی از دو نام را دارد):

```bash
sudo certbot certonly --webroot -w /var/www/html -d seodaily.ir -d www.seodaily.ir
```

**nginx:** تنظیم فعلی وردپرس برای seodaily.ir را پیدا کنید (`grep -rl seodaily.ir /etc/nginx/`) و آن را با `deploy/nginx-seodaily.ir.conf` جایگزین کنید. اگر گواهی شما مسیر دیگری دارد، دو خط `ssl_certificate` را اصلاح کنید. بعد:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**Apache:** vhost فعلی (`grep -rl seodaily.ir /etc/apache2/`) را با `deploy/apache-seodaily.ir.conf` جایگزین کنید:

```bash
sudo a2enmod ssl proxy proxy_http headers
sudo apachectl configtest && sudo systemctl reload apache2
```

**بررسی ریدایرکت‌ها** (هر سه باید `301` و `Location: https://seodaily.ir/...` بدهند و آخری `200`):

```bash
curl -sI http://seodaily.ir/seo | head -3
curl -sI http://www.seodaily.ir/seo | head -3
curl -sI https://www.seodaily.ir/seo | head -3
curl -sI https://seodaily.ir/seo | head -1
```

حالا `https://seodaily.ir` سایت جدید را نشان می‌دهد. وارد `/admin` شوید، رمز مدیر را از «حساب کاربری» عوض کنید و در «تنظیمات سایت» آدرس سایت، اطلاعات تماس و کد Search Console را وارد کنید.

### ۸) حذف وردپرس

بعد از این‌که مطمئن شدید سایت جدید درست کار می‌کند:

```bash
sudo rm -rf /var/www/seodaily.ir            # مسیر فایل‌های وردپرس
mysql -u root -p -e "DROP DATABASE WORDPRESS_DB_NAME; DROP USER 'WORDPRESS_DB_USER'@'localhost';"
```

(فایل‌های PHP-FPM یا تنظیمات دیگری که فقط برای این سایت ساخته شده بودند را هم می‌توانید حذف کنید.)

### بازگشت به نسخهٔ قبلی

```bash
cd /opt/seodaily
docker images seodaily                        # تگ‌های نسخه‌های قبلی (شناسهٔ commit)
docker tag seodaily:<TAG> seodaily:latest && docker compose up -d
```

یا در GitHub همان commit قبلی را revert و push کنید.

### استقرار دستی (بدون GitHub Actions)

روی یک سیستم با اینترنت آزاد:

```bash
docker build -t seodaily:latest .
docker save seodaily:latest | gzip | ssh deploy@SERVER 'gunzip | docker load'
scp deploy/docker-compose.prod.yml deploy@SERVER:/opt/seodaily/docker-compose.yml
ssh deploy@SERVER 'cd /opt/seodaily && docker compose up -d'
```

---

## پشتیبان‌گیری و بازیابی

داده‌ها در دو volume داکر نگهداری می‌شوند:

| volume | محتوا |
| --- | --- |
| `<project>_pgdata` | دیتابیس PostgreSQL |
| `<project>_uploads` | تصاویر آپلودشده |

پیشوند `<project>` نام پروژه Compose است که به‌طور پیش‌فرض همان نام پوشه پروژه است؛ برای پوشه `seodaily` نام‌ها `seodaily_pgdata` و `seodaily_uploads` می‌شوند. نام دقیق را با `docker volume ls` ببینید.

دستورهای زیر را در پوشه پروژه اجرا کنید. اگر `POSTGRES_USER` یا `POSTGRES_DB` را تغییر داده‌اید، `seodaily` را در دستورها جایگزین کنید.

### پشتیبان دیتابیس

روش زیر در PowerShell و لینوکس یکسان کار می‌کند (فایل داخل کانتینر ساخته و بعد کپی می‌شود):

```bash
docker compose exec db pg_dump -U seodaily -d seodaily -Fc -f /tmp/seodaily.dump
docker compose cp db:/tmp/seodaily.dump ./seodaily.dump
```

در لینوکس می‌توانید نسخه متنی SQL هم بگیرید:

```bash
docker compose exec -T db pg_dump -U seodaily -d seodaily | gzip > seodaily.sql.gz
```

> در PowerShell از `>` برای ذخیره خروجی `pg_dump` استفاده نکنید؛ ممکن است encoding فایل را خراب کند. همان روش `-Fc` و `docker compose cp` را به کار ببرید.

### بازیابی دیتابیس

```bash
docker compose stop app
docker compose cp ./seodaily.dump db:/tmp/seodaily.dump
docker compose exec db pg_restore -U seodaily -d seodaily --clean --if-exists --no-owner /tmp/seodaily.dump
docker compose start app
```

بازیابی از فایل SQL متنی (لینوکس):

```bash
docker compose stop app
gunzip -c seodaily.sql.gz | docker compose exec -T db psql -U seodaily -d seodaily
docker compose start app
```

> نسخه متنی را روی دیتابیس خالی بازیابی کنید. برای یک سرور تازه: `docker compose up -d db`، بازیابی، سپس `docker compose up -d`.

### پشتیبان تصاویر آپلودشده

(از خود ایمیج سایت استفاده می‌شود تا روی سرور به دانلود ایمیج دیگری نیاز نباشد. برای بازیابی تصاویر روی سیستم خودتان، ایمیج باید یک بار ساخته شده باشد.)

لینوکس / مک:

```bash
docker run --rm -u 0 --entrypoint tar -v seodaily_uploads:/data -v "$PWD":/backup seodaily:latest czf /backup/uploads.tgz -C /data .
```

ویندوز (PowerShell):

```powershell
docker run --rm -u 0 --entrypoint tar -v seodaily_uploads:/data -v "${PWD}:/backup" seodaily:latest czf /backup/uploads.tgz -C /data .
```

### بازیابی تصاویر

لینوکس / مک (در PowerShell به‌جای `"$PWD":/backup` بنویسید `"${PWD}:/backup"`):

```bash
docker run --rm -u 0 --entrypoint tar -v seodaily_uploads:/data -v "$PWD":/backup seodaily:latest xzf /backup/uploads.tgz -C /data
```

فایل‌های `seodaily.dump` و `uploads.tgz` را در جایی خارج از سرور (فضای ابری یا دیسک دیگر) نگه دارید. دیتابیس و تصاویر با هم معنی دارند، پس هر دو را همزمان پشتیبان بگیرید.

---

## توسعه محلی بدون Docker

پیش‌نیاز: Node.js 22 و PostgreSQL 16. اگر PostgreSQL نصب ندارید، فقط دیتابیس را با Docker اجرا کنید (سرویس `db` در Compose پورتی به بیرون باز نمی‌کند، پس یک کانتینر جدا لازم است):

```bash
docker run -d --name seodaily-pg -p 5432:5432 -e POSTGRES_DB=seodaily -e POSTGRES_USER=seodaily -e POSTGRES_PASSWORD=devpass postgres:16-alpine
```

در `.env` خط `DATABASE_URL` را فعال کنید (Next.js فایل `.env` را خودش می‌خواند):

```ini
DATABASE_URL=postgres://seodaily:devpass@localhost:5432/seodaily
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=devpassword123
```

اسکریپت‌های مایگریشن و seed هم فایل `.env` را (اگر وجود داشته باشد) می‌خوانند:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

سایت روی <http://localhost:3000> بالا می‌آید. در حالت توسعه اگر `SESSION_SECRET` تنظیم نشده باشد، یک کلید ناامن موقت با هشدار استفاده می‌شود و تصاویر در پوشه `uploads/` پروژه ذخیره می‌شوند.

| دستور | کار |
| --- | --- |
| `npm run dev` | سرور توسعه |
| `npm run build` / `npm start` | build و اجرای نسخه production |
| `npm run db:generate` | ساخت مایگریشن جدید در `drizzle/` بعد از تغییر `src/db/schema.ts` (فایل تولیدشده را commit کنید) |
| `npm run db:migrate` | اعمال مایگریشن‌ها |
| `npm run db:seed` | ساخت اولین مدیر و محتوای اولیه (فقط جدول‌های خالی) |
| `npm run lint` | بررسی ESLint |
| `npm run typecheck` | بررسی TypeScript |

---

## ساختار پروژه

```text
seodaily/
├── docker/entrypoint.sh      # مایگریشن + seed + اجرای سرور هنگام شروع کانتینر
├── Dockerfile                # ایمیج چندمرحله‌ای (standalone)
├── docker-compose.yml        # سرویس‌های db و app و volume‌های pgdata و uploads
├── drizzle/                  # مایگریشن‌های SQL دیتابیس
├── scripts/
│   ├── migrate.mjs           # اعمال مایگریشن‌ها (با انتظار برای آماده شدن دیتابیس)
│   ├── seed.mjs              # ساخت اولین مدیر و پر کردن جدول‌های خالی
│   └── seed-data.mjs         # محتوای اولیه طرح
├── public/fonts/             # فونت وزیر و مجوز OFL
└── src/
    ├── app/                  # فقط مسیرها: احراز هویت، دریافت داده و چیدن template/organismها
    │   ├── (site)/           # صفحات سایت عمومی
    │   ├── admin/            # پنل مدیریت (login و (panel))
    │   ├── api/health/       # بررسی سلامت
    │   ├── uploads/          # ارائه فایل‌های آپلودشده
    │   ├── sitemap.ts
    │   └── robots.ts
    ├── components/           # اتمیک دیزاین (هر لایه یک index.ts دارد)
    │   ├── atoms/            # کوچک‌ترین اجزا: Icon، ButtonLink، Badge، Checkbox، SubmitButton …
    │   ├── molecules/        # ترکیب اتم‌ها: SectionHeading، BrowserFrame، Breadcrumb، Field، Card …
    │   ├── organisms/        # بخش‌های کامل: هدر، فوتر، FAQ، فرم‌ها، Repeater
    │   │   ├── sections/     # سکشن‌های هر صفحه (home، services، seo، about، contact …)
    │   │   └── admin/        # بلوک‌های پنل: جدول درخواست‌ها، ویرایشگر FAQ، فرم تنظیمات …
    │   └── templates/        # اسکلت صفحه: SiteShell، AdminShell، ServicePageTemplate …
    ├── modules/              # منطق دامنه به تفکیک ماژول
    │   ├── auth/             # نشست، ورود/خروج، حساب کاربری
    │   ├── services/ projects/ faqs/ team/ leads/
    │   │                     # هر کدام: queries (خواندن با کش)، actions (Server Action)، routes، content
    │   ├── settings/         # types، defaults، queries، actions (تنظیمات و متن/سئوی صفحات)
    │   ├── menus/            # منوهای دسکتاپ و موبایل: ساختار، اعتبارسنجی درخت، پیش‌فرض‌ها
    │   ├── pricing/          # تعرفه‌ها، محاسبه برآورد (مشترک بین مرورگر و سرور)، اعتبارسنجی
    │   ├── contracts/        # قالب قرارداد، جای‌گذاری مقادیر، عدد به حروف
    │   ├── pages/            # متن‌های ثابت طرح برای هر صفحه
    │   ├── seo/              # متادیتا، canonical، Open Graph و JSON-LD
    │   ├── uploads/          # ذخیره و اعتبارسنجی تصاویر
    │   └── admin/            # کوئری‌های مخصوص پنل
    ├── db/                   # اسکیمای Drizzle و اتصال دیتابیس
    ├── lib/                  # زیرساخت مشترک: cache، utils، form-actions، toast
    └── proxy.ts              # هدایت مسیرهای /admin به صفحه ورود
```

قاعدهٔ وابستگی: `app` ← `templates` ← `organisms` ← `molecules` ← `atoms`. کامپوننت‌ها داده را فقط از props می‌گیرند و به دیتابیس دسترسی ندارند؛ خواندن و نوشتن داده فقط در `modules/*` انجام می‌شود.

---

## عیب‌یابی

ابتدا وضعیت و لاگ‌ها را ببینید:

```bash
docker compose ps
docker compose logs --tail=100 app
curl http://localhost:3000/api/health
```

`/api/health` در حالت سالم `{"status":"ok"}` برمی‌گرداند و اگر دیتابیس در دسترس نباشد، خطای 503 با `"database":"unreachable"` می‌دهد. Docker هم هر ۳۰ ثانیه همین آدرس را بررسی می‌کند (ستون STATUS در `docker compose ps`).

**خطای `Set SESSION_SECRET in .env` یا `Set POSTGRES_PASSWORD in .env` هنگام اجرای Compose**
مقدار آن متغیر در `.env` خالی است یا فایل `.env` در پوشه پروژه وجود ندارد. `SESSION_SECRET` باید حداقل ۳۲ کاراکتر باشد، وگرنه برنامه در production اجرا نمی‌شود.

**مدیر ساخته نشد / نمی‌توانم وارد شوم**
- در لاگ برنامه پیام `No admin user exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars)` یعنی ایمیل خالی است یا رمز کمتر از ۸ کاراکتر است. `.env` را اصلاح و `docker compose up -d` را دوباره اجرا کنید.
- اگر کاربری از قبل وجود داشته باشد، تغییر `ADMIN_EMAIL`/`ADMIN_PASSWORD` در `.env` اثری ندارد. برای بازنشانی رمز فراموش‌شده، کاربران را حذف کنید تا در شروع بعدی از روی `.env` دوباره ساخته شوند:

  ```bash
  docker compose exec db psql -U seodaily -d seodaily -c "DELETE FROM users;"
  docker compose restart app
  ```

- اگر ورود موفق است ولی دوباره به صفحه ورود برمی‌گردید، احتمالاً `COOKIE_SECURE=true` است و سایت را با `http://` باز کرده‌اید. روی localhost آن را `false` بگذارید.

**پورت ۳۰۰۰ اشغال است**
در `.env` مثلاً `APP_PORT=8080` بگذارید، `docker compose up -d` را اجرا کنید و سایت را روی `http://localhost:8080` باز کنید.

**کانتینر app مدام ری‌استارت می‌شود با خطای `entrypoint.sh: no such file or directory` (ویندوز)**
Git انتهای خط فایل‌ها را به CRLF تبدیل کرده است. در پوشه پروژه اجرا کنید:

```powershell
git config core.autocrlf false
git rm --cached -r . -q
git reset --hard
docker compose up -d --build
```

**خطای `password authentication failed` در لاگ برنامه**
`POSTGRES_PASSWORD` را بعد از اولین اجرا عوض کرده‌اید؛ رمز دیتابیس فقط بار اول تنظیم می‌شود. یا مقدار قبلی را برگردانید، یا رمز را داخل دیتابیس هم عوض کنید:

```bash
docker compose exec db psql -U seodaily -d seodaily -c "ALTER USER seodaily WITH PASSWORD 'NewPassword123';"
```

**آپلود تصویر پشت nginx با خطای 413 مواجه می‌شود**
`client_max_body_size 10m;` را به تنظیم nginx اضافه و nginx را reload کنید. محدودیت خود برنامه ۵ مگابایت برای هر تصویر است.

**آدرس‌های نقشه سایت یا canonical با `localhost` ساخته می‌شوند**
«آدرس اصلی سایت» را در تنظیمات پنل یا `SITE_URL` را در `.env` تنظیم کنید.
