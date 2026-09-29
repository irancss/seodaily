# وضعیت اجرایی — کتابخانه افزونه‌های وردپرس

> Checkpoint برای ادامه کار.
>
> شاخه: `feature/plugins-library` · پایه: `main` در `6f2b406`

## مرحله جاری

P11/P12 — مستندات، CI، PR، merge، استقرار و راستی‌آزمایی Production.

## انجام‌شده

| مرحله | فایل‌های اصلی | آزمون | وضعیت |
| --- | --- | --- | --- |
| P00 کشف | — | Baseline سبز (FINAL-RELEASE-AUDIT.md) | ✅ |
| P01 مدل داده و slug | `src/db/plugins-schema.ts`، `drizzle/0004_plugins_library.sql` (۱۷ جدول)، `src/modules/slugs/*` | PL-T01 | ✅ |
| ادیتور بلوکی | `src/modules/blocks/*`، `components/organisms/admin/block-editor/*` | unit blocks، smoke | ✅ |
| P02 کاتالوگ | `src/modules/plugins/{catalog,actions,admin-queries}.ts`، پنل | PL-T02 | ✅ |
| P03–P06 خط لوله | `src/modules/plugins/pipeline/*`، `src/worker/main.ts`، پنل منابع/پایش | PL-T03…T17 | ✅ (ClamAV و sandbox: BLOCKED) |
| P07–P08 دانلود | `src/modules/downloads/*`، route فایل، پنل کاربران، CSV | PL-T18…T29 | ✅ (پیامک واقعی: BLOCKED) |
| P09–P10 صفحات عمومی | `src/app/(site)/plugins/*`، `components/organisms/plugins/*`، sitemap، Home | PL-T30…T33 | ✅ |
| استقرار | Dockerfile، entrypoint، compose (worker، `plugin_files`)، ops scripts، CI | shellcheck، compose config | ✅ کد؛ روی سرور: پس از merge |

## مستندات

`IMPLEMENTATION-REPORT.md` · `ADMIN-GUIDE.fa.md` · `OPERATIONS-RUNBOOK.md` · `TEST-MATRIX.md` · `DECISIONS-AND-BLOCKERS.md`

## Blockerها

B1 پیامک ملی‌پیامک · B2 ClamAV · B3 Runner ایزوله · B4 اتصال واقعی منابع · B5 مجوز بازنشر · B6 متن حریم خصوصی — جزئیات در DECISIONS-AND-BLOCKERS.md.
