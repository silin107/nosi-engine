/**
 * promptBuilder.js
 * -------------------------------------------------------
 * هذا أهم جزء تقني: كيف "نجبر" النموذج على إخراج كود قابل للتنفيذ
 * بدل نص حر، وكيف نعطيه فقط ما يحتاجه من السياق (لا الشجرة كاملة كل مرة
 * إن كانت كبيرة، بل ملخص + القسم المطلوب تعديله).
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
5. إذا كان الطلب غامضًا، اختر التفسير الأقرب منطقيًا واذكر افتراضك في "explanation".`;
}

function buildUserPrompt({ userMessage, siteTree, recentConversation }) {
  // نرسل ملخص الشجرة (عناوين الأقسام فقط) لا الكود الكامل، لتقليل التكلفة،
  // إلا القسم المستهدف تحديدًا إن كان التعديل عليه.
  const summary = siteTree.pages.map((p) => ({
    pageId: p.id,
    path: p.path,
    sections: p.sections.map((s) => ({ id: s.id, type: s.type })),
  }));

  return `حالة الموقع الحالية (ملخص):
${JSON.stringify(summary, null, 2)}

آخر رسائل المحادثة:
${JSON.stringify(recentConversation, null, 2)}

طلب المستخدم الجديد:
"${userMessage}"

أعد التعديل المطلوب بصيغة JSON فقط وفق القواعد المحددة في system prompt.`;
}

module.exports = { buildSystemPrompt, buildUserPrompt };
