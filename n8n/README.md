# ورکفلوهای n8n برای نمکدون

## پیش‌نیاز

1. n8n روی `https://n8n.alecasgari.com`
2. Credential رسمی **Google Gemini**
3. ساخت Data Table با نام دقیق `namakdoon_recipes`  
   ستون‌ها: ببینید `data-table-schema.md`

## توکن ادمین (بدون env)

چون بعضی نصب‌های Docker متغیر محیطی را به ورکفلو پاس نمی‌دهند، توکن به‌صورت **مقدار ثابت** داخل نودهای `Auth OK?` گذاشته شده:

```text
CHANGE_ME_ADMIN_TOKEN
```

این مقدار را در **همه** ورکفلوهای زیر، داخل نود `Auth OK?`، فیلد سمت راست شرط، به یک رمز قوی یکسان عوض کنید:

- `03-namakdoon-create.json`
- `04-namakdoon-update.json`
- `05-namakdoon-delete.json`
- `06-namakdoon-auth.json`

همان رمز را موقع ورود در سایت وارد می‌کنید.

> پیشنهاد: یک رمز بلند تصادفی بگذارید و فقط خودتان نگه دارید. لازم نیست در فرانت هاردکد شود.

## ایمپورت

1. در n8n: **Workflows → Import from File**
2. این فایل‌ها را ایمپورت کنید:

- `workflows/01-namakdoon-list.json`
- `workflows/02-namakdoon-get.json` ← پشتیبانی `id` و `slug`
- `workflows/03-namakdoon-create.json`
- `workflows/04-namakdoon-update.json`
- `workflows/05-namakdoon-delete.json`
- `workflows/06-namakdoon-auth.json` ← برای چک کردن توکن قبل از ورود به پنل
- `workflows/07-namakdoon-upload.json` ← آپلود عکس/ویدیو روی دیسک سرور
- `workflows/08-namakdoon-sitemap.json` ← سایت‌مپ داینامیک دستورها

3. در Create: Credential جمینای را به نودهای Gemini وصل کنید
4. توکن ثابت را در همه ورکفلوهای ادمین یکسان کنید
5. برای مدیا: `MEDIA.md` را بخوانید (فولدر + nginx)
6. همه را **Active** کنید

Create دو حالت دارد:

- `mode=preview` → فقط ساخت دستور با AI (بدون ذخیره)
- `mode=publish` → ذخیره دستور تأییدشده در Data Table

## آدرس وبهوک‌ها

| کار | متد | مسیر |
|-----|-----|------|
| لیست | GET | `/webhook/namakdoon-list` |
| جزئیات | GET | `/webhook/namakdoon-get?id=...` |
| تأیید ورود | POST | `/webhook/namakdoon-auth` |
| ساخت | POST | `/webhook/namakdoon-create` |
| ویرایش | POST | `/webhook/namakdoon-update` |
| حذف | POST | `/webhook/namakdoon-delete` |

هدر ادمین:

```http
X-Admin-Token: همان مقدار ثابت داخل نود Auth OK?
```

## نکته مدل

مدل روی `gemini-flash-lite-latest` تنظیم شده. اگر در لیست n8n نام فرق داشت، از دراپ‌داون همان نود انتخابش کنید.
