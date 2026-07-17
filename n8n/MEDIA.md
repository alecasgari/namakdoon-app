# راه‌اندازی مدیا روی سرور (با NPM)

سایت `namakdoon.alecasgari.com` روی GitHub Pages است؛ پس فایل‌ها را از **`https://n8n.alecasgari.com/media/`** سرو می‌کنیم.

فقط فولدر و استک **n8n** و یک پراکسی کوچک در NPM تغییر می‌کند. بقیه سرویس‌ها دست نخورده می‌مانند.

## ۱) روی سرور (SSH)

```bash
# فقط همین پوشه را بساز
mkdir -p ~/n8n/namakdoon-media
chmod 775 ~/n8n/namakdoon-media
```

## ۲) فقط docker-compose مربوط به n8n

برو داخل فولدر n8n:

```bash
cd ~/n8n
ls
# معمولاً docker-compose.yml اینجاست
```

قبل از ویرایش، بکاپ بگیر:

```bash
cp docker-compose.yml docker-compose.yml.bak-$(date +%F)
```

### الف) به سرویس n8n یک volume اضافه کن

زیر `services:` → سرویس n8n (اسمش معمولاً `n8n` است) در بخش `volumes:` این خط را **اضافه** کن (خط‌های قبلی را پاک نکن):

```yaml
      - ./namakdoon-media:/home/node/namakdoon-media
```

### ب) یک سرویس خیلی کوچک فقط برای سرو فایل اضافه کن

همین فایل compose، پایین `services:` این بلوک را اضافه کن:

```yaml
  namakdoon-media:
    image: nginx:alpine
    container_name: namakdoon-media
    restart: unless-stopped
    volumes:
      - ./namakdoon-media:/usr/share/nginx/html:ro
    # پورت را به اینترنت باز نکن؛ فقط داخل شبکه داکر
    expose:
      - "80"
```

اگر n8n داخل یک `networks:` سفارشی است، همان network را به `namakdoon-media` هم بده تا NPM/n8n ببینندش. اگر network پیش‌فرض compose است، معمولاً کافی است.

اعمال فقط برای همین استک:

```bash
cd ~/n8n
docker compose up -d
# یا اگر نسخه قدیمی‌تر:
# docker-compose up -d
```

چک کن:

```bash
docker ps --filter name=namakdoon-media
docker ps --filter name=n8n
```

نباید کانتینرهای mailcow / npm / nextcloud و بقیه ری‌استارت اجباری شده باشند مگر اینکه اشتباهاً compose دیگری را زده باشی.

## ۳) در Nginx Proxy Manager (`npm.alecasgari.com`)

فقط Proxy Host مربوط به **`n8n.alecasgari.com`** را ویرایش کن:

1. برو به همان Proxy Host موجود n8n (چیز جدیدی برای کل دامنه نساز که تداخل بسازد)
2. تب **Custom Locations**
3. **Add Location**:
   - Location: `/media/`
   - Scheme: `http`
   - Forward Hostname / IP: `namakdoon-media`  
     (اگر NPM و n8n در یک شبکه داکر نیستند، IP داخلی سرور + پورت publish لازم می‌شود؛ در حالت استاندارد compose مشترک، اسم کانتینر کافی است)
   - Forward Port: `80`
4. Save

اگر NPM کانتینر `namakdoon-media` را Resolve نکرد:

گزینه امن جایگزین:

- در سرویس `namakdoon-media` موقتاً بگذار:
  ```yaml
  ports:
    - "127.0.0.1:8099:80"
  ```
- در NPM Custom Location برای `/media/`:
  - Forward Hostname: `127.0.0.1` یا IP سرور
  - Port: `8099`

این پورت فقط روی localhost باز است و سرویس‌های دیگر را درگیر نمی‌کند.

## ۴) ورکفلو n8n

1. ایمپورت و Active کردن `07-namakdoon-upload.json`
2. توکن Auth را مثل بقیه روی همان مقدار ثابت بگذار
3. مسیر Write File باید باشد: `/home/node/namakdoon-media/...` (در ورکفلو از قبل همین است)

## ۵) تست

```bash
echo ok > ~/n8n/namakdoon-media/test.txt
curl -I https://n8n.alecasgari.com/media/test.txt
```

باید `200` بگیری. بعد از پنل نمکدون یک عکس آپلود کن.

## چیزهایی که عمداً انجام نده

- کانفیگ mailcow / nextcloud / portainer را دست نزن
- NPM Proxy Hostهای دیگر را عوض نکن
- پورت‌های `80/443` کل سرور را دوباره map نکن
- `docker compose down` روی استک‌های دیگر نزن
