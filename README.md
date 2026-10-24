# ⚡ EV Smart Dashboard — لوحة الشحن الذكية

تطبيق عربي (RTL) لتسجيل ومتابعة شحنات السيارة الكهربائية: الطاقة، التكلفة، المسافة، كفاءة الاستهلاك، التقويم، وتقدير الرحلات.
**React + Vite + Tailwind CSS + Lucide Icons + Recharts** — يعمل كـ PWA أو يُحوَّل إلى APK عبر Capacitor.
جميع البيانات تُحفظ محلياً على الجهاز (localStorage)، بدون خادم.

## التشغيل

```bash
npm install
npm run dev        # تطوير على http://localhost:5173
npm run build      # بناء الإنتاج إلى dist/
npm run preview    # معاينة نسخة الإنتاج
```

أول مرة: من **الإعدادات** عدّل اسم السيارة، **سعة البطارية (kWh)**، وأسعار الكيلوواط. زر «بيانات تجريبية» لمعاينة كل الشاشات.

## الميزات

| الشاشة | المحتوى |
|---|---|
| الرئيسية | KPIs (الطاقة، التكلفة، المسافة، الكفاءة، تكلفة الكم) + مقارنة منزلي/سريع + رسم الأشهر |
| الشحنات | السجل مع فلتر الشهر والنوع، وتعديل/حذف أي شحنة |
| التقويم | أيام الشحن بوسم أخضر (منزلي) وبرتقالي (سريع) والنقر على اليوم يعرض شحناته |
| الرحلات | مسافة + مكان الشحن ⇒ الطاقة، نسبة البطارية، التكلفة، نسبة الوصول |
| الإعدادات | السيارة، الأسعار، تصدير CSV، نسخة احتياطية JSON واستعادتها |

## كيف تُحسب الأرقام

- **الطاقة المكتسبة** = (SoC بعد − SoC قبل) ÷ 100 × سعة البطارية. يمكن تعديلها يدوياً من شاشة الشاحن.
- **التكلفة**: أدخل سعر الكيلوواط فيُحسب المبلغ، أو أدخل المبلغ فيُحسب السعر.
- **المسافة والكفاءة** (تحتاج قراءة عداد في شحنتين على الأقل): لكل مقطع بين قراءتي عداد
  - المسافة = فرق القراءتين
  - الطاقة المستهلكة = (SoC بعد الشحنة السابقة − SoC قبل الشحنة الحالية) × السعة، مضافاً إليها أي شحنات وسيطة بلا عداد
  - الكفاءة = الطاقة المستهلكة ÷ المسافة × 100 (kWh/100km)، وتكلفة الكم من متوسط سعر الشحنات في المقطع
  - يُنسب المقطع إلى الشحنة التي تُنهيه (شهرها ونوعها). المقاطع غير المنطقية (عداد رجع للخلف أو بطارية زادت) تُتجاهل.
- **تقدير الرحلة** يستخدم معدلك الفعلي (أو الافتراضي من الإعدادات قبل توفر البيانات) وسعر نوع الشاحن من سجلك.

> الدقة تتحسن كلما سجّلت قراءة العداد باستمرار وكانت نسب SoC من شاشة السيارة.

## الرفع على GitHub

```bash
git init && git add . && git commit -m "EV Smart Dashboard"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

- **PWA على GitHub Pages**: من Settings ← Pages اختر Source = GitHub Actions. سير العمل `deploy-pages.yml` ينشر تلقائياً عند كل push على `main`. (المسارات نسبية `base: './'` فيعمل على أي مسار فرعي.) افتح الرابط من الهاتف ← «إضافة إلى الشاشة الرئيسية».
- **APK من GitHub**: Actions ← «Build Android APK» ← Run workflow، ثم نزّل `app-debug.apk` من Artifacts.

## تحويل إلى APK عبر Capacitor (محلياً)

المتطلبات: Node 18+، JDK 17، Android Studio (أو Android SDK).

```bash
npm install
npm run build
npx cap add android      # مرة واحدة
npm run cap:sync         # بعد كل تعديل
npm run cap:open         # يفتح Android Studio ← Build ▸ Build APK(s)
# أو من الطرفية:
cd android && ./gradlew assembleDebug
# الناتج: android/app/build/outputs/apk/debug/app-debug.apk
```

داخل APK يستخدم التصدير مشاركة الملفات الأصلية (Share) لحفظ CSV والنسخ الاحتياطية.
لإصدار متجر Play ستحتاج توقيع `release` (keystore) — راجع توثيق Android.

## هيكل المشروع

```
src/
  App.jsx               الحالة والتنقل والفلاتر
  lib/calc.js           كل الحسابات (طاقة، مقاطع، KPIs، تقدير الرحلة)
  lib/storage.js        localStorage + نسخ احتياطي
  lib/csv.js            تصدير CSV (BOM لعرض العربية في Excel)
  components/           Kpis, Charts, TypeCompare, ChargeForm, ChargeList, CalendarView, TripEstimator, SettingsView
public/                 manifest + service worker + الأيقونات
```
