# نمکدون (Namakdoon)

وب‌اپ استاتیک دستورهای آشپزی فارسی با بک‌اند کاملاً روی **n8n** و دیتابیس **Data Table**.

- دمو GitHub Pages: `https://alecasgari.github.io/namakdoon-app/index/`
- دامنه بعدی: `https://namakdoon.alecasgari.com`
- n8n: `https://n8n.alecasgari.com`

## امکانات

- لندینگ معرفی + کارت دستورها
- فهرست با جستجو و فیلتر تگ
- صفحه جزئیات با **مقیاس مواد بر اساس تعداد نفرات**
- منوی پایین چسبان در موبایل (خانه / دستورها / پنل)
- ورود ادمین با توکن (قبل از باز شدن پنل از n8n چک می‌شود)
  - افزودن از **متن** یا **ویس ضبط‌شده** یا **فایل صوتی**
  - ویرایش و حذف
- تبدیل ویس/متن به دستور ساخت‌یافته با **Google Gemini** در n8n
- فونت **Peyda** (اعداد فارسی)

## ساختار پروژه

```text
index/           صفحه اصلی (/index/)
recipes/         فهرست دستورها
recipe/          جزئیات دستور (?id=)
admin/           ورود و پنل ادمین
assets/          CSS / JS / فونت Peyda / تصاویر
n8n/             ورکفلوهای قابل ایمپورت + اسکیمای جدول
```

آدرس‌ها به صورت پوشه‌ای هستند تا روی GitHub Pages به‌جای `index.html` به شکل `/index/` باز شوند.

## راه‌اندازی GitHub Pages

1. ریپو را Push کنید (اگر از قبل push شده، همین کافی است)
2. در GitHub بروید به: **Settings → Pages**
3. **Build and deployment**
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Save کنید و ۱–۲ دقیقه صبر کنید
5. سایت اینجاست:  
   `https://alecasgari.github.io/namakdoon-app/index/`

برای دامنه اختصاصی (`namakdoon.alecasgari.com`):

- در روت ریپو فایل `CNAME` با همین دامنه بسازید
- DNS را به GitHub Pages وصل کنید
- در `assets/js/config.js` روی آن دامنه، `basePath` خودکار خالی می‌شود

## راه‌اندازی n8n

راهنمای کامل: [`n8n/README.md`](n8n/README.md)

خلاصه:

1. جدول `namakdoon_recipes` را بسازید (`n8n/data-table-schema.md`)
2. ۶ ورکفلو داخل `n8n/workflows/` را ایمپورت کنید (شامل `06-namakdoon-auth`)
3. در نودهای `Auth OK?` مقدار `CHANGE_ME_ADMIN_TOKEN` را به یک رمز ثابت یکسان عوض کنید
4. Credential جمینای را وصل و ورکفلوها را Active کنید
5. از `/admin/` با همان رمز وارد شوید

## سئو

- `lang="fa"` و `dir="rtl"`
- عنوان/توضیح/canonical/Open Graph/Twitter Card
- `robots.txt` و `sitemap.xml`
- JSON-LD برای WebSite و Recipe
- صفحه ادمین `noindex`
