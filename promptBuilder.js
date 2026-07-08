/**
 * promptBuilder.js - تحسينات
 * -------------------------------------------------------
 * يحسّن قواعد البرومبت ويضيف معالجة أفضل للأخطاء
 */

function buildSystemPrompt() {
  return `أنت محرك برمجي مدمج داخل منصة NOSI لبناء المواقع بالمحادثة.
مهمتك: استقبال طلب المستخدم بالعربية أو الإنجليزية + شجرة الموقع الحالية (JSON)،
وإرجاع "تعديل" على الشجرة فقط، وليس الموقع كاملًا من الصفر.

القواعد الصارمة:
1. أعد JSON فقط، بدون أي نص قبله أو بعده، بدون Markdown، بدون backticks.
2. الشكل المطلوب حصرًا:
{
  "action": "add_section" | "update_section" | "delete_section" | "update_theme" | "add_page",
  "pageId": "معرّف الصفحة المستهدفة",
  "section": {
    "id": "معرّف فريد للقسم",
    "type": "hero" | "features" | "footer" | "gallery" | "contact" | "custom",
    "code": "كود مكوّن React كامل وقابل للتنفيذ (JSX)، بدون imports خارجية غير React",
    "props": { }
  },
  "explanation": "جملة قصيرة بالعربية تشرح للمستخدم ماذا فعلت"
}
3. الكود يجب أن يكون React functional component واحد فقط، self-contained،
   يستخدم Tailwind classes فقط للتنسيق (لا CSS منفصل).
4. لا تكرر مكوّنات موجودة مسبقًا في الشجرة إلا إذا طلب المستخدم "تعديلها" صراحة.
5. إذا كان الطلب غامضًا، اختر التفسير الأقرب منطقيًا واذكر افتراضك في "explanation".
6. تأكد دائمًا من أن جميع المعرّفات (id) فريدة وسهلة التذكر (بدون أحرف خاصة).
7. لا تستخدم أي مكتبات خارجية في الكود - استخدم React و Tailwind فقط.`;
}

function buildUserPrompt({ userMessage, siteTree, recentConversation }) {
  // نرسل ملخص الشجرة (عناوين الأقسام فقط) لا الكود الكامل، لتقليل التكلفة،
  // إلا القسم المستهدف تحديدًا إن كان التعديل عليه.
  const summary = siteTree.pages.map((p) => ({
    pageId: p.id,
    path: p.path,
    title: p.title || p.id,
    sections: p.sections.map((s) => ({ id: s.id, type: s.type })),
  }));

  const recentHistory = recentConversation
    .slice(-4) // آخر 4 رسائل فقط
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  return `حالة الموقع الحالية (ملخص):
${JSON.stringify(summary, null, 2)}

آخر رسائل المحادثة:
${recentHistory || "(لا توجد رسائل سابقة)"}

طلب المستخدم الجديد:
"${userMessage}"

أعد التعديل المطلوب بصيغة JSON فقط وفق القواعد المحددة في system prompt.`;
}

module.exports = { buildSystemPrompt, buildUserPrompt };
