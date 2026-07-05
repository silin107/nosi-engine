# NOSI Engine — المرحلة 1 و 2 (Orchestrator + Context Manager)

هذا هو "المحرك" الذي يحوّل رسالة المستخدم إلى تعديل حقيقي وقابل للتنفيذ
على شجرة الموقع، بدل مجرد نص محادثة.

## ما تم بناؤه في هذه المرحلة

- **siteTreeSchema.js** — نموذج البيانات: موقع → صفحات → أقسام (كل قسم = مكوّن React).
- **contextManager.js** — حفظ/استرجاع حالة كل مشروع (حاليًا JSON محلي، استبدله بقاعدة بيانات حقيقية في الإنتاج).
- **promptBuilder.js** — البرومبت الهندسي الذي يجبر Claude على إخراج JSON منظم فقط (لا نص حر).
- **validator.js** — يفحص: صحة JSON، صحة بناء الجملة (syntax) عبر esbuild، وأنماط أمنية خطيرة.
- **orchestrator.js** — يربط كل شيء، ويعيد المحاولة تلقائيًا (حتى مرتين) إذا فشل التحقق.
- **server.js** — نقطتا API: `/api/chat` و `/api/project/:id`.

## كيف تشغّله

```bash
cd nosi-engine
npm install
cp .env.example .env   # ثم ضع مفتاح Anthropic API الحقيقي
npm run dev
```

اختبار سريع:
```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"projectId":"demo1","message":"أضف قسم هيرو (Hero) بعنوان ترحيبي وزر تواصل"}'
```

## كيف تربطه بواجهة Base44 الحالية

في مكان استدعاء الذكاء الاصطناعي الحالي داخل الواجهة، استبدله باستدعاء:
`POST /api/chat` مع `{ projectId, message }`. الرد يحتوي `siteTree` كاملة
محدّثة — استخدمها لتحديث المعاينة مباشرة بدل انتظار توليد نص وتفسيره.

## ما لم يُبنَ بعد (الخطوات التالية بالترتيب)

1. **Sandbox / Live Preview**: تشغيل `siteTree.pages[].sections[].code` فعليًا
   داخل WebContainers أو iframe معزول لعرض نتيجة حقيقية (وليس JSON فقط).
2. **قاعدة بيانات حقيقية**: استبدال ملفات JSON بـ PostgreSQL (schema بسيط:
   جدول `projects`، عمود `site_tree jsonb`).
3. **محرك النشر**: زر "نشر" يأخذ `siteTree`، يحوّلها لملفات React/Next.js فعلية،
   وينشرها عبر Vercel API بدومين فرعي تلقائي.
4. **تحسين الأمان**: sandboxing حقيقي لتنفيذ الكود (ليس فقط فحص أنماط نصية).

هذه المرحلة (1+2) هي الأساس الذي لا يمكن للخطوات التالية أن تعمل بدونه —
لأنها أول مرة يصبح فيها للموقع "ذاكرة هيكلية" حقيقية بدل محادثة عابرة.
