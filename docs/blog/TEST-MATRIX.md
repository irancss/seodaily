# ماتریس نیازمندی و شواهد بلاگ

نام مسیرها نسبت به ریشه repository است. آزمون‌های destructive فقط دیتابیس موقت دارند؛ E2E بلاگ دامنه production را رد می‌کند.

| نیاز | پیاده‌سازی | آزمون و شاهد |
|---|---|---|
| BL-T01–02: دسته، namespace و رقابت | blog/actions، slugs/registry، 0006_blog | integration/blog: article/category race، reserved، استقلال plugins؛ E2E ساخت دسته |
| BL-T03: draft، autosave، snapshot، دو تب | blog/publication، admin/blog/article-form | integration: optimistic version race و snapshot؛ E2E autosave و عنوان خصوصی |
| BL-T04: شروط انتشار | blog/content، publication، uploads/metadata | unit: draft ناقص؛ integration: تصویر/دسته نامعتبر؛ E2E انتشار بدون تصویر رد |
| BL-T05: قرارداد editor و XSS | blocks/schema/validate/text، shared block-editor/renderer | unit/blocks موجود + unit/blog؛ رگرسیون editor افزونه‌ها؛ عنوان جدول افزوده شد |
| BL-T06: عدم نشت/preview | blog/routes/queries، admin preview، proxy | E2E: 404 draft، عدم متن خصوصی در HTML، auth و no-store/noindex |
| BL-T07: زمان‌بندی | worker/main، blog/publication | unit Tehran boundary؛ integration دو worker، cancel/edit/retry/missed schedule؛ E2E worker واقعی |
| BL-T08: تاریخ واقعی | publication با مقایسه عمیق snapshot | integration: تاریخ ثابت در publish بدون تغییر و ویرایش خصوصی |
| BL-T09: مطالعه | blog/content، options | unit: فارسی/نیم‌فاصله/code/CTA، override/reset |
| BL-T10: TOC پایدار | outline با stable mode، ArticleView | unit: heading هم‌نام و ویرایش عنوان؛ CSS scroll-margin |
| BL-T11: share محدود | blog/share-buttons | E2E: Telegram/WhatsApp و canonical؛ کپی با fallback و بازگشت focus |
| BL-T12: پیشنهاد/لینک/ورودی/خروجی | blog/suggestions/link-audit، blocks/actions، article_links | integration: entity rename و مقصد آرشیوشده؛ audit بدون شبکه و پیشنهاد فقط با تأیید |
| BL-T13: مرتبط | blog/queries، فرم دستی | integration: self/noindex/archive و سقف تعداد؛ انتخاب دستی با ترتیب |
| BL-T14–15: فهرست/search/page/featured | blog-list، queries، metadata | integration: featured بیرون صفحه اول، صفحات بدون تکرار؛ E2E search noindex و invalid page 404 |
| BL-T16–18: هشت مقاله و حرکت | HomeBlogSection، BlogCarousel | integration ترتیب published_at؛ E2E تعداد ۸، autoplay واقعی، pause، reduced-motion، no-JS |
| BL-T19: بخش افزونه | Home هم‌زمان دو section دارد | رگرسیون plugin و Home در suite موجود؛ هیچ تغییر در OTP/quota/retention/nightly |
| BL-T20: تصویر و OG | uploadBlockImage، storedImageSize، ArticleView | E2E upload/OG default؛ ابعاد از فایل؛ optimizer Next موجود |
| BL-T21: author/schema/H1 | ArticleView، JsonLd، organizationJsonLd | E2E BlogPosting و canonical؛ SEO suite و escape موجود JsonLd |
| BL-T22–23: حذف/restore/alias | publication + slug registry | integration trash/restore/media و A→B→C؛ E2E HTTP 301 مستقیم |
| BL-T24: مجوز و CSRF | requireAdmin تمام actions، Next Server Actions | E2E منع preview؛ security suite موجود؛ version race در integration |
| BL-T25: محدوده قابلیت | فقط routeهای blog/admin و نیازمندی‌ها | بررسی کد: RSS/tag/comment/rating/views/newsletter ساخته نشده |
| BL-T26: ارتقای امن | 0006_blog.sql و snapshot | db/blog-upgrade: حفظ service/plugin/download users/logo؛ هر دو جدول محتوا خالی |
| BL-T27: رگرسیون افزونه | زیرساخت موجود | integration دانلود/OTP/pipeline/slugs و E2E plugins در CI |
| BL-T28: responsive/a11y | tokens قالب، cards، editor | E2E article 320/390/768/1440، axe article؛ layout هشت عرض و admin a11y شامل blog |
| BL-T29: build و regression | workflow موجود | lint/typecheck/build/unit/integration/db/SEO/security/E2E؛ نتایج دقیق در گزارش اجرا |
| BL-T30: انتشار واقعی | deploy + blog-worker-health | چک SHA سایت، smoke /blog و unknown route، heartbeat نسخه جاری؛ پس از merge ثبت می‌شود |

مقادیر عملکرد، test count، محدودیت محیط محلی و لینک اجرای نهایی در IMPLEMENTATION-REPORT نگهداری می‌شوند. عبور خودکار axe، اثبات دسترس‌پذیری تمام محتواهای آینده یا تضمین SEO نیست.
