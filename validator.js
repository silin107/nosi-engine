/**
 * validator.js - تحسينات شاملة
 * -------------------------------------------------------
 * فحص شامل للكود والأمان والصيغة
 */

const esbuild = require("esbuild");

const FORBIDDEN_PATTERNS = [
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /document\.write/,
  /window\.location\s*=/,
  /<script/i,
  /fetch\s*\(/i, // منع استدعاءات fetch مباشرة (أمان)
  /XMLHttpRequest/,
  /require\s*\(/, // منع require في كود المكوّن
  /import\s+from/, // منع imports
];

function checkSecurity(code) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return {
        safe: false,
        reason: `تم رصد نمط غير مسموح: ${pattern.source}`,
      };
    }
  }
  return { safe: true };
}

async function checkSyntax(code) {
  try {
    // نلف الكود كملف JSX ونمرره على esbuild فقط للتحقق من صحة البناء
    await esbuild.transform(code, {
      loader: "jsx",
      jsx: "automatic",
      target: "es2020",
    });
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

function checkJsonStructure(parsed) {
  const errors = [];

  // التحقق من الحقول الإلزامية
  if (!parsed.action) errors.push("الحقل 'action' مفقود");
  if (!parsed.pageId) errors.push("الحقل 'pageId' مفقود");
  if (!parsed.explanation) errors.push("الحقل 'explanation' مفقود");

  // التحقق من الحقل section
  if (parsed.action !== "delete_section" && !parsed.section) {
    errors.push("الحقل 'section' مفقود (مطلوب لجميع الإجراءات ما عدا delete_section)");
  }

  if (parsed.section) {
    if (!parsed.section.id) errors.push("الحقل 'section.id' مفقود");
    if (!parsed.section.type) errors.push("الحقل 'section.type' مفقود");
    if (parsed.section.code && typeof parsed.section.code !== "string") {
      errors.push("الحقل 'section.code' يجب أن يكون نص (string)");
    }
  }

  return errors;
}

async function validateAiResponse(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, errors: ["الرد ليس JSON صالحًا"] };
  }

  // التحقق من بنية JSON
  const structureErrors = checkJsonStructure(parsed);
  errors.push(...structureErrors);

  const allowedActions = [
    "add_section",
    "update_section",
    "delete_section",
    "update_theme",
    "add_page",
  ];

  if (!allowedActions.includes(parsed.action)) {
    errors.push(
      `action غير معروف: ${parsed.action}. المقبول: ${allowedActions.join(", ")}`
    );
  }

  // التحقق من الكود إن وجد
  if (parsed.section && parsed.section.code) {
    const security = checkSecurity(parsed.section.code);
    if (!security.safe) errors.push(security.reason);

    // فحص الصيغة فقط إذا كان آمنًا
    if (security.safe) {
      const syntax = await checkSyntax(parsed.section.code);
      if (!syntax.valid) errors.push(`خطأ بناء جملة: ${syntax.reason}`);
    }
  }

  // التحقق من أن المعرّف فريد (عدم وجود أحرف خاصة)
  if (parsed.section && parsed.section.id) {
    if (!/^[a-zA-Z0-9_-]+$/.test(parsed.section.id)) {
      errors.push(
        `معرّف القسم يحتوي أحرف غير مسموحة. استخدم a-z, 0-9, _, - فقط: ${parsed.section.id}`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { validateAiResponse, checkSyntax, checkSecurity };
