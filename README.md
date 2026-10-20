# IT Desk | بوابة طلبات الدعم الفني وتقنية المعلومات

نظام رقمي داخلي متكامل لإدارة ومتابعة طلبات الدعم الفني، تم إعادة بنائه وتطويره بأحدث تقنيات الويب الحديثة المتوافقة 100% مع بيئة النشر السحابي على **Vercel**.

---

## 🚀 التقنيات المستخدمة (Modern Stack)

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router & Serverless API Routes)
- **Frontend UI**: [React 18](https://react.dev/) + [Tailwind CSS RTL](https://tailwindcss.com/)
- **Data Fetching & State**: [TanStack Query v5 (React Query)](https://tanstack.com/query/latest)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) (دعم SQLite محلياً و PostgreSQL على Vercel/Supabase/Neon)
- **Icons & Typography**: [Lucide React](https://lucide.dev/) + خط [Cairo](https://fonts.google.com/specimen/Cairo) من Google Fonts
- **Authentication**: JWT Cookies + Bcrypt Passwords Hashing
- **Deployment Platform**: [Vercel](https://vercel.com/) (دعم تلقائي كامل بدون خوادم Serverless)

---

## ✨ المميزات الرئيسية للمشروع

1. **إدارة دورة حياة التذاكر**:
   - إنشاء التذاكر مع تحديد التصنيف، مستوى الأولوية (منخفضة، متوسطة، مرتفعة، حرجة/عاجلة)، والوصف.
   - متابعة مراحل المعالجة: `جديدة (New)` ⬅️ `قيد المعالجة (InProgress)` ⬅️ `معلقة (OnHold)` ⬅️ `تم الحل (Resolved)` ⬅️ `مغلقة (Closed)`.
   - توثيق سبب التأخير عند تعليق التذكرة لاحتسابه واستبعاده من وقت SLA.
2. **اتفاقية مستوى الخدمة (SLA Clock)**:
   - احتساب دقيق لوقت الاستجابة المستغرق والمتبقي لكل مستوى أولوية.
   - تنبيهات التذاكر المتأخرة ومؤشرات أداء وقت الحل.
3. **نظام الإسناد التلقائي وقواعد الأقسام**:
   - إسناد التذاكر تلقائياً للموظف المسؤول عن القسم.
   - دعم حالة الإجازات (On Leave) مع الإسناد التلقائي للبديل (Backup Assignee).
4. **التواصل والردود والملاحظات الداخلية**:
   - محادثة تفاعلية لكل تذكرة مع إمكانية إضافة "ملاحظات داخلية" تظهر لفريق الدعم فقط دون العميل.
   - سجل تاريخي موثق لكل حركة (Audit History Trail).
5. **لوحة مؤشرات الأداء (Dashboard & KPIs)**:
   - إجمالي التذاكر، الحالات، تذاكر اليوم، معدل الالتزام بـ SLA، وتوزيع الطلبات حسب الأقسام.
6. **إدارة النظام للمسؤولين (Admin Panel)**:
   - إدارة المستخدمين وتفعيل الحسابات واعتماد التسجيل الذاتي.
   - إدارة الأقسام والتصنيفات.
   - تخصيص الهوية البصرية، الشعار، الألوان، وأوقات SLA.
   - سجل تدقيق العمليات (Activity Log).
7. **واجهة عربية أنيقة بالكامل (RTL)** تدعم الوضع الداكن (Dark Mode).

---

## 🔑 الحسابات الافتراضية للتجربة

| الدور | البريد الإلكتروني | كلمة المرور |
| :--- | :--- | :--- |
| **مدير النظام (Admin)** | `admin@itdesk.local` | `Pass@123` |
| **أخصائي دعم فني (IT)** | `tech@itdesk.local` | `Pass@123` |
| **مستخدم عادي (User)** | `user@itdesk.local` | `Pass@123` |

---

## 💻 التشغيل المحلي (Local Development)

```bash
# 1. الدخول إلى مجلد المشروع
cd it-desk-next

# 2. تثبيت الحزم
npm install

# 3. مزامنة قاعدة البيانات المحلية (SQLite)
npx prisma db push

# 4. تعبئة البيانات الأولية والحسابات التجريبية
npm run db:seed

# 5. تشغيل خادم التطوير
npm run dev
```

افتح المتصفح على: `http://localhost:3000`

---

## ☁️ خطوات النشر على Vercel (Deployment)

1. **إنشاء قاعدة بيانات PostgreSQL مجانية**:
   - أنشئ قاعدة بيانات على [Supabase](https://supabase.com/) أو [Neon](https://neon.tech/) أو [Vercel Postgres](https://vercel.com/storage/postgres).
   - انسخ رابط الاتصال `DATABASE_URL` (مثال: `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).

2. **تجهيز ملف `prisma/schema.prisma` للإنتاج**:
   في سطر `datasource db`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **الرفع على GitHub ثم الاستيراد في Vercel**:
   - ارفع كود المشروع إلى مستودع GitHub.
   - توجه إلى لوحة تحكم Vercel واضغط **Add New Project** ثم اختر المستودع.
   - في خانة **Environment Variables** أضف:
     - `DATABASE_URL`: رابط اتصال قاعدة البيانات PostgreSQL.
     - `JWT_SECRET`: مفتاح أمان عشوائي طويل لتشفير الجلسات.
   - اضغط **Deploy**.

4. **تهيئة قاعدة البيانات في الإنتاج**:
   بعد أول عملية نشر، قم بتشغيل الأوامر التالية عبر Vercel CLI أو محلياً مع توجيه `DATABASE_URL` لقاعدة بيانات الإنتاج:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```
