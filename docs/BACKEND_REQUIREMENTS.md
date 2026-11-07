# NOIRÉ — متطلبات الـ Backend (Supabase)

> الحالة: **جاهز للتنفيذ**. هذا المستند هو المرجع الوحيد لمتطلبات الخلفية. كل ما هو مذكور هنا إمّا موجود في المستودع (✅) أو مطلوب كخطوة تشغيلية منك (🔑) أو مؤجَّل لمرحلة لاحقة (🔜).

---

## 0. ملخص تنفيذي

| البند | القرار |
|---|---|
| المنصة | **Supabase** (Postgres 15 + Auth + Storage + RLS + RPC) |
| الاستضافة | **Vercel** (موجودة: `noire-mu-eight.vercel.app`) |
| المصادقة | Supabase Auth — رابط دخول عبر البريد (Magic Link) أولاً، Google OAuth اختياري |
| الصلاحيات | ثلاثة أدوار: `customer` / `staff` / `admin` تُحفظ في `profiles.role` وتُنسخ تلقائياً إلى JWT (`app_metadata.role`) |
| التسعير والطلبات | **كلها على الخادم** عبر دالة `place_order()` داخل Postgres (معاملة واحدة، Idempotent) |
| الدفع | 🔜 Stripe (Payment Intents + Webhook). الهيكل جاهز، التكامل في المرحلة 2 |
| الترجمة | جداول `*_translations` لكل كيان كتالوج بحسب `locale` (`en` / `ar`) |
| التبديل | متغير `NOIRE_DATA_SOURCE=mock|supabase` — الموقع يعمل على البيانات الوهمية حتى تُضاف المفاتيح |

---

## 1. ما تم تجهيزه في المستودع ✅

| الملف | الوظيفة |
|---|---|
| `supabase/migrations/20261107000000_init_schema.sql` | المخطط الكامل: 24 جدولاً، Enums، Triggers، Views، سياسات RLS، Grants |
| `supabase/migrations/20261107000100_commerce_functions.sql` | دوال RPC: `place_order`, `validate_discount`, `quote_shipping`, `set_order_status`, `mark_order_paid`, `admin_dashboard_stats` |
| `supabase/config.toml` | إعدادات Supabase CLI للتطوير المحلي (المنافذ، Auth redirects، Storage bucket) |
| `scripts/seed-supabase.ts` | تحميل بيانات الكتالوج الحالية + الترجمات العربية إلى قاعدة البيانات (`npm run db:seed`) |
| `scripts/seed-rows.ts` | مُنشئ الصفوف المشترك بين `db:seed` و`db:seed:sql` (ترتيب آمن للمفاتيح الأجنبية) |
| `scripts/seed-sql.ts` + `supabase/seed.sql` | نفس بيانات التعبئة كـ SQL متكرّر الاستخدام (upsert) يُلصق في SQL Editor أو يُنفَّذ عبر CLI — لا يحتاج service_role (`npm run db:seed:sql`) |
| `types/supabase.ts` | أنواع TypeScript للمخطط (مكتوبة يدوياً — تُستبدل بـ `npm run db:types` بعد الربط) |
| `lib/env.ts` | قراءة آمنة لمتغيرات البيئة + اختيار مصدر البيانات |
| `lib/supabase/client.ts` | عميل المتصفح (anon key) |
| `lib/supabase/server.ts` | عميل الخادم (cookies) + عميل الإدارة (service role) |
| `lib/supabase/middleware.ts` | تجديد الجلسة في الـ middleware |
| `lib/supabase/auth.ts` | `getAuthContext`, `requireUser`, `requireStaff`, `requireAdmin` للاستخدام في Server Actions |
| `lib/services/supabase/mappers.ts` | تحويل صفوف قاعدة البيانات ↔ عقود TypeScript الحالية (مع الترجمة) |
| `lib/services/supabase/catalog.ts` | قراءات الكتالوج من Supabase بنفس توقيعات `lib/mock-api` |
| `lib/services/localized.ts` | الموزّع: يختار mock أو Supabase حسب `NOIRE_DATA_SOURCE` |
| `lib/account/supabase-customer-session.ts` | مزوّد جلسة العميل (يحل محل `previewCustomerSessionProvider`) |
| `middleware.ts` | حماية `/account` (مستخدم مسجّل) و`/admin` (staff/admin) عند تفعيل Supabase |
| `app/[locale]/auth/sign-in` + `components/auth/sign-in-form.tsx` | صفحة تسجيل الدخول (EN/AR) |
| `app/api/auth/callback/route.ts` | استبدال كود الدخول بجلسة |
| `app/api/auth/sign-out/route.ts` | تسجيل الخروج |
| `lib/auth/actions.ts` | Server Action لإرسال رابط الدخول |
| `.env.example` | كل المتغيرات المطلوبة مع الشرح |
| `tests/unit/supabase-mappers.test.ts`, `tests/unit/env.test.ts` | اختبارات التحويل والبيئة (43 اختباراً ناجحاً إجمالاً) |

---

## 2. خطوات التشغيل المطلوبة منك 🔑

### 2.1 إنشاء المشروع
1. أنشئ مشروعاً على [supabase.com](https://supabase.com) — المنطقة الأقرب لعملائك (مثلاً `eu-central-1` فرانكفورت).
2. احفظ: **Project URL**، **anon key**، **service_role key**، **DB password** (من Settings → API / Database).

### 2.2 تطبيق المخطط
```bash
npm i -g supabase            # أو: npx supabase
supabase login               # يفتح المتصفح لإنشاء access token
supabase link --project-ref <PROJECT_REF>
npm run db:push              # يطبّق ملفات supabase/migrations/*.sql
```
> بديل بدون CLI: افتح SQL Editor في لوحة Supabase، والصق محتوى الملفين بالترتيب (schema ثم functions) ونفّذهما.

### 2.3 المتغيرات
محلياً: `cp .env.example .env.local` ثم املأ القيم.
على Vercel: Project → Settings → Environment Variables (لبيئتي **Production** و**Preview**):

| المتغير | أين يُستخدم | سرّي؟ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | المتصفح + الخادم | لا |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المتصفح + الخادم | لا (محمي بـ RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | الخادم فقط (seed، webhooks، إدارة) | **نعم** |
| `NEXT_PUBLIC_SITE_URL` | روابط البريد وإعادة التوجيه | لا |
| `NOIRE_DATA_SOURCE` | `supabase` لتفعيل القاعدة | لا |

### 2.4 إعداد Auth في لوحة Supabase
- **Authentication → URL Configuration**:
  - Site URL: `https://noire-mu-eight.vercel.app`
  - Redirect URLs: `https://noire-mu-eight.vercel.app/api/auth/callback`، `http://localhost:3000/api/auth/callback`، ونمط المعاينات `https://*-hu1300husam-ops.vercel.app/api/auth/callback`
- **Authentication → Email Templates → Magic Link**: استبدل الرابط بـ
  `{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/account`
  (أو اترك `{{ .ConfirmationURL }}` — كلاهما مدعوم من `exchangeCodeForSession`).
- للإنتاج: اربط **SMTP مخصّص** (Resend / Postmark / SES) — بريد Supabase الافتراضي محدود بـ 3 رسائل/ساعة.
- (اختياري) **Providers → Google**: أدخل Client ID/Secret من Google Cloud Console.

### 2.5 تعبئة البيانات
```bash
npm run db:seed          # يحتاج SUPABASE_SERVICE_ROLE_KEY
# أو بدون مفتاح service_role:
npm run db:seed:sql      # يولّد supabase/seed.sql → الصقه في Dashboard → SQL Editor (أو: supabase db query -f supabase/seed.sql)
```
> **تنبيه:** في وضع `NOIRE_DATA_SOURCE=supabase` يُظهر الموقع خطأ 500 إذا كان الكتالوج فارغاً — نفّذ التعبئة مباشرة بعد الهجرات.
يرفع: 12 منتجاً، 6 فئات، 4 مجموعات، المقالات، طرق الشحن، أكواد الخصم التجريبية، الترجمات العربية للفئات والمجموعات، والإعدادات الافتراضية.

### 2.6 أول مدير
1. سجّل دخولك مرة واحدة من `/auth/sign-in` (يُنشأ `profile` تلقائياً).
2. نفّذ `SEED_ADMIN_EMAIL=you@example.com npm run db:seed` أو في SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. سجّل الخروج والدخول مرة أخرى لتحديث الـ JWT. الآن `/admin` متاح لك فقط.

### 2.7 توليد الأنواع (بعد أي تعديل على المخطط)
```bash
SUPABASE_PROJECT_REF=<ref> npm run db:types
```

---

## 3. نموذج البيانات

```
auth.users ──1:1── profiles ──1:N── addresses
                      │
                      ├──1:N── orders ──1:N── order_items
                      │           ├──1:N── order_events
                      │           ├──0:1── discount_redemptions ──N:1── discounts
                      │           └──1:N── inventory_movements ──N:1── products
                      ├──1:N── wishlist_items ──N:1── products
                      ├──0:1── carts
                      └──1:N── reviews ──N:1── products

categories ──1:N── products ──N:M── collections   (product_collections)
     │                 │     └──N:M── products      (product_relations)
     │                 └──1:N── product_translations (locale)
     └──1:N── category_translations                 collections ──1:N── collection_translations

shipping_methods · settings · journal_articles · newsletter_subscribers · audit_log
```

### قرارات التصميم
- **معرّفات الكتالوج `text`** (`prod-01`, `cat-audio`) للحفاظ على التوافق مع البيانات الحالية والروابط؛ كل ما يُنشأ وقت التشغيل `uuid`.
- **الحقول الوثائقية `jsonb`** (`gallery`, `colors`, `options`, `specifications`, `story_blocks`, `faqs`) — تُقرأ ككتلة واحدة ولا تُستعلم منفردة. المخزون على مستوى المنتج كما في النموذج الحالي.
- **الترجمة بجداول منفصلة** `*_translations (entity_id, locale)`: أي حقل `null` يسقط تلقائياً على النص الإنجليزي (نفس سلوك `catalog-localizer` الحالي).
- **لقطات (Snapshots) في الطلبات**: `shipping_method`, `shipping_address`, `billing_address` تُخزَّن كـ jsonb داخل الطلب كي لا يتغير الطلب التاريخي عند تعديل العناوين أو طرق الشحن.
- **الأموال `numeric(12,2)`** بالدولار. قيد `check` يضمن `total = subtotal − discount + shipping + tax`.
- **بحث نصي كامل** عبر عمود مولَّد `search_vector` (GIN) + `pg_trgm` للاسم.
- **تدقيق**: كل تعديل على `products`, `discounts`, `orders` يُسجَّل في `audit_log` مع هوية المنفّذ.

---

## 4. المصادقة والصلاحيات

| الدور | من يحصل عليه | ما يستطيعه |
|---|---|---|
| `anon` (زائر) | بلا تسجيل | قراءة الكتالوج المنشور، التحقق من كود خصم، إنشاء طلب كضيف، الاشتراك بالنشرة |
| `customer` | أي مستخدم مسجّل (افتراضي) | + ملفه، عناوينه، طلباته، مفضلته، سلته، إرسال مراجعة (تنتظر الاعتماد) |
| `staff` | يعيّنه admin | + قراءة كل الطلبات/العملاء، تحديث حالة الطلبات، قراءة الخصومات والإعدادات |
| `admin` | يعيّنه admin / service role | + كل عمليات الكتابة على الكتالوج والخصومات والإعدادات وإدارة الأدوار |

- الدور يُحفظ في `profiles.role` و**يُنسخ تلقائياً** إلى `auth.users.raw_app_meta_data.role` بواسطة Trigger، فتقرأه سياسات RLS من الـ JWT دون استعلام إضافي.
- لا يستطيع المستخدم تعديل `role` / `status` / `tier` / `notes` / `client_code` لنفسه (Trigger حارس يرفض).
- **قاعدة ذهبية**: كل Server Action إداري يبدأ بـ `await requireStaff()` أو `requireAdmin()` من `lib/supabase/auth.ts`، حتى لو كان الـ middleware يحمي المسار.
- الـ `service_role` key لا يصل أبداً إلى المتصفح؛ يُستخدم فقط في: seed، Webhooks، ومهام الخلفية.

---

## 5. مسار الطلب (Checkout) على الخادم

```
المتصفح                         Postgres (place_order)
  │  items[{productId,colorId,     │
  │   optionId,quantity}],         │ 1. idempotencyKey موجود؟ → أعد نفس الطلب
  │  shippingMethodId,             │ 2. طريقة الشحن فعّالة وتخدم الدولة؟
  │  discountCode?, addresses,     │ 3. لكل سطر: المنتج active؟ اللون/الخيار متاح؟ المخزون كافٍ؟ (قفل الصف)
  │  payment{provider,last4..},    │    → إعادة التسعير من products.price + option.priceDelta
  │  idempotencyKey                │ 4. validate_discount() بنفس القواعد
  │ ─────────────────────────────▶ │ 5. quote_shipping() (+ شحن مجاني فوق الحد أو بكود)
  │                                │ 6. إدراج orders + order_items (لقطات)
  │                                │ 7. خصم المخزون + inventory_movements + تحديث stock_status
  │ ◀───────────── order_id ────── │ 8. discount_redemptions + usage_count، order_events
```
- **الضريبة = 0** حالياً (`settings.store.tax.enabled=false`). عند الحاجة: Stripe Tax أو جدول نسب حسب الدولة داخل `quote_tax()`.
- إلغاء/إرجاع الطلب (`set_order_status`) يعيد المخزون تلقائياً ويسجّل الحركة.
- الطلب يبدأ `pending_settlement`؛ `mark_order_paid()` (يُستدعى من Webhook الدفع فقط) ينقله إلى `processing`.

### ما يجب تغييره في الواجهة عند التفعيل (🔜 مرحلة التكامل)
| الحالي | المطلوب |
|---|---|
| `lib/mock-api.createOrder / finalizeOrder` يحسب المجاميع محلياً | استدعاء `supabase.rpc('place_order', { payload })` من Server Action وإرجاع `order_id` |
| الطلبات محفوظة في `localStorage` (`CommerceContext.placedOrders`) | قراءة الطلبات من `orders` للمستخدم المسجّل؛ للضيف: صفحة تأكيد عبر رابط موقّع بالبريد |
| السلة والمفضلة في `localStorage` | إبقاء localStorage للضيوف + مزامنة مع `carts` / `wishlist_items` عند تسجيل الدخول |
| `validateDiscountCode` محلي | `supabase.rpc('validate_discount', { p_code, p_subtotal })` |
| `lib/admin/actions.ts` بلا حماية | `requireStaff()` + كتابة عبر عميل الخادم (RLS تطبّق دور المدير) |

---

## 6. الدفع (المرحلة 2) 🔜

القرار الموصى به: **Stripe** (Payment Element يدعم البطاقات + Apple Pay + Google Pay).

1. `POST /api/checkout/intent` (Server Action): ينشئ الطلب عبر `place_order` ثم `stripe.paymentIntents.create({ amount: total*100, currency: 'usd', metadata: { order_id } })` ويعيد `client_secret`.
2. المتصفح يؤكد الدفع بـ Payment Element (لا تمر بيانات البطاقة عبر خادمنا أبداً).
3. `POST /api/webhooks/stripe`: يتحقق من التوقيع (`STRIPE_WEBHOOK_SECRET`)، وعند `payment_intent.succeeded` يستدعي `mark_order_paid(order_id, pi_id)` بعميل service role؛ عند `payment_intent.payment_failed` يضبط `payment_status='failed'`.
4. بريد تأكيد الطلب عبر Resend من نفس الـ Webhook (قالب EN/AR حسب `orders.locale`).

المتغيرات المطلوبة موجودة معلّقة في `.env.example`.

---

## 7. التخزين (Storage)

- Bucket عام `product-media` (معرّف في `config.toml`) لصور المنتجات. حالياً الصور من Unsplash؛ عند رفع صور حقيقية: `supabase.storage.from('product-media').upload(...)` من لوحة الإدارة ثم حفظ الرابط العام في `products.primary_image/gallery`.
- أضِف نطاق المشروع إلى `next.config.mjs → images.remotePatterns`: `*.supabase.co`.
- سياسة الرفع: admin فقط (`storage.objects` policy — تُضاف عند تفعيل الرفع).

---

## 8. الأمان — قائمة تحقق

- [x] RLS مفعّل على **كل** الجداول، لا يوجد جدول مكشوف.
- [x] الخصومات لا تُقرأ من المتصفح؛ فقط عبر RPC يعيد نتيجة التحقق.
- [x] الطلبات لا تُدرج مباشرة (`Insert: never` في الأنواع + لا توجد سياسة insert) — فقط عبر `place_order`.
- [x] لا تُخزَّن بيانات بطاقات: فقط `brand/last4/cardholder` + مرجع المزوّد.
- [x] `mark_order_paid` محجوبة عن anon/authenticated.
- [x] Idempotency key يمنع تكرار الطلب عند إعادة الإرسال.
- [x] Audit log لتعديلات الكتالوج والخصومات والطلبات.
- [ ] 🔑 فعّل **Captcha** (hCaptcha/Turnstile) في Supabase Auth للحد من إساءة إرسال روابط الدخول.
- [ ] 🔑 فعّل **Point-in-Time Recovery** للنسخ الاحتياطي (خطة Pro).
- [ ] 🔜 Rate limiting على `/api/*` (Vercel WAF أو Upstash).
- [ ] 🔜 Security headers في `next.config.mjs` (CSP, HSTS, X-Frame-Options).

---

## 9. خطة التنفيذ المقترحة

| المرحلة | المحتوى | المخرجات |
|---|---|---|
| **A — التفعيل** (أنت) | إنشاء المشروع، push للمخطط، المتغيرات على Vercel، seed، أول مدير | الكتالوج يُقرأ من Supabase على الموقع المباشر، تسجيل الدخول يعمل |
| **B — الحساب والعميل** | ربط صفحات `/account` بـ `profiles/addresses/orders`، مزامنة السلة والمفضلة | حساب عميل حقيقي |
| **C — الطلبات** | Server Action للـ checkout عبر `place_order`، صفحة تأكيد من القاعدة، لوحة الطلبات للإدارة | طلبات حقيقية بدون دفع (تحويل بنكي / الدفع عند التسليم) |
| **D — الدفع** | Stripe + Webhook + بريد التأكيد | تحصيل فعلي |
| **E — الإدارة** | حماية `lib/admin/actions.ts`، محرر المنتجات يكتب في القاعدة، رفع الصور، الترجمة من اللوحة | إدارة كاملة بدون كود |

كل مرحلة تُسلَّم بـ PR مستقل مع اختبارات.

---

## 10. القرارات التي أحتاج تأكيدها منك

1. **الدفع**: Stripe مناسب؟ (إن كان السوق الخليجي/اليمني أساسياً قد نحتاج Tap / HyperPay / Moyasar بدلاً منه أو إلى جانبه.)
2. **العملة**: الدولار فقط حالياً. هل نضيف عملات أخرى (السعر مخزّن بالدولار ويُعرض محوّلاً، أم أسعار مستقلة لكل عملة)؟
3. **الضيوف**: السماح بالشراء دون تسجيل (الوضع الحالي يسمح) أم إلزام التسجيل؟
4. **الضريبة والشحن**: هل توجد قواعد فعلية (نسب ضريبة، دول مستهدفة، شركة شحن)؟ الحالي بيانات توضيحية.
5. **Google OAuth**: نفعّله من البداية أم نكتفي برابط البريد؟
