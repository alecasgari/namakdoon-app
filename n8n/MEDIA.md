# سرو کردن عکس و ویدیو (راه ۱)

فایل‌ها روی سرور n8n در این مسیر نوشته می‌شوند:

```text
/home/node/namakdoon-media/
```

و فرانت از این آدرس عمومی می‌خواند:

```text
https://namakdoon.alecasgari.com/media/<filename>
```

## Docker

Volume را به کانتینر n8n مانت کنید، مثلاً:

```yaml
volumes:
  - ./namakdoon-media:/home/node/namakdoon-media
```

پوشه را بسازید و دسترسی نوشتن بدهید.

## Nginx (دامنه سایت یا همان n8n)

نمونه برای سرو فایل‌ها روی دامنه سایت:

```nginx
location /media/ {
  alias /path/to/namakdoon-media/;
  add_header Access-Control-Allow-Origin *;
  expires 30d;
}
```

اگر فایل‌ها روی ماشین n8n هستند و سایت روی GitHub Pages است، یا:

1. همان پوشه را روی سروری که دامنه `namakdoon.alecasgari.com` را پروکسی می‌کند سرو کنید، یا
2. در `assets/js/config.js` مقدار `mediaBase` را به آدرس واقعی سرو فایل‌ها عوض کنید.

## ورکفلو

`07-namakdoon-upload.json` را ایمپورت و Active کنید.
توکن Auth را مثل بقیه ورکفلوها روی همان مقدار ثابت بگذارید.
