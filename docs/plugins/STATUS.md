# وضعیت اجرایی — کتابخانه افزونه‌های وردپرس

> Checkpoint برای ادامه کار. با هر مرحله به‌روز می‌شود.
>
> شاخه: `feature/plugins-library` · پایه: `main` در `6f2b406`

## مرحله جاری

P01 — مدل داده، Migration و Slug registry

## انجام‌شده

| مرحله | فایل‌ها | آزمون | وضعیت |
| --- | --- | --- | --- |
| P00 کشف | — | Baseline: همه مجموعه‌های قبلی سبز در `main` (FINAL-RELEASE-AUDIT.md) | ✅ |
| P01 Schema | `src/db/plugins-schema.ts`، `drizzle/0004_plugins_library.sql` (۲۲ جدول، CHECKها، ۱۵ slug رزرو) | Migration روی DB خالی و اجرای دوم بی‌اثر | ✅ |
| P01 Slug | `src/modules/slugs/{normalize,registry}.ts` | `tests/unit/slugs.test.mjs`، `tests/integration/slugs.test.mjs` (PL-T01، شامل هم‌زمانی) | ✅ |

## تصمیم‌ها (خلاصه؛ جزئیات در DECISIONS-AND-BLOCKERS.md)

- Worker جدا: `src/worker` با esbuild به `worker.mjs` در همان Image، سرویس `worker` در Compose. پردازش فایل در درخواست HTTP نیست.
- ادیتور: TipTap (MIT) + Renderer سمت سرور اختصاصی.
- ZIP: Parser داخلی بدون وابستگی (کنترل دقیق سقف‌ها).
- SMS: `POST https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber` (از SDK رسمی)، موفقیت فقط با `RetStatus = 1` و `Value` عددی.
- آزمون یکپارچه: `npm run test:integration` با `--conditions=react-server` روی DB یک‌بارمصرف.

## Blockerهای شناخته‌شده

- دسترسی شبکه این محیط به سایت‌های منبع نمونه و مستندات ملی‌پیامک مسدود است: Adapterها با Fixture، اتصال واقعی `NOT VERIFIED`.
- Credential ملی‌پیامک و الگو: از مالک (تنظیمات `.env` سرور).
- ClamAV و Runner ایزوله وردپرس روی سرور فعلی: بررسی در P04.
