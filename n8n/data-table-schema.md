# Data Table: `namakdoon_recipes`

در n8n برو به **Data tables** و یک جدول با همین نام بساز.

| ستون | نوع | توضیح |
|------|-----|--------|
| `slug` | string | شناسه انگلیسی URL-friendly |
| `title` | string | عنوان فارسی |
| `description` | string | توضیح کوتاه |
| `ingredients` | string | JSON آرایه مواد |
| `steps` | string | JSON آرایه مراحل |
| `prep_time` | number | دقیقه آماده‌سازی |
| `cook_time` | number | دقیقه پخت |
| `servings_base` | number | تعداد نفرات پایه |
| `meal_type` | string | وعده (صبحانه/ناهار/شام/...) |
| `tags` | string | JSON آرایه تگ |
| `tips` | string | نکات |
| `calories` | number | کالری تقریبی هر نفر |
| `difficulty` | string | آسان / متوسط / سخت |

ستون‌های سیستمی `id`, `createdAt`, `updatedAt` خودکار ساخته می‌شوند.

## نمونه `ingredients`

```json
[
  { "name": "برنج", "amount": 2, "unit": "پیمانه", "note": "" },
  { "name": "زعفران", "amount": 0.25, "unit": "قاشق چای‌خوری", "note": "دم‌کرده" }
]
```

## نمونه `steps`

```json
[
  { "text": "برنج را خیس کنید." },
  { "text": "آب را به جوش بیاورید و برنج را بپزید." }
]
```
