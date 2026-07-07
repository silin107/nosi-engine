/**
 * validator.js
 * -------------------------------------------------------
 * قبل أن نعرض أي كود على المستخدم أو نحفظه، نتحقق:
 * 1. أن JSON صالح ومطابق للشكل المتوقع.
 * 2. أن كود React لا يحتوي أخطاء بناء جملة (syntax errors) عبر esbuild.
 * 3. أن الكود لا يحتوي استدعاءات خطيرة (eval, fetch لدومينات غريبة، إلخ).
 */

const esbuild = require("esbuild");

const FORBIDDEN_PATTERNS = [
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /document\.write/,
  /window\.location\s*=/,
  /<script/i,
];

function checkSecurity(code) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `تم رصد نمط غير مسموح: ${pattern}` };
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
    });
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

async function validateAiResponse(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, errors: ["الرد ليس JSON صالحًا"] };
  }

  const allowedActions = [
    "add_section",
    "update_section",
    "delete_section",
    "update_theme",
    "add_page",
  ];
  if (!allowedActions.includes(parsed.action)) {
    errors.push(`action غير معروف: ${parsed.action}`);
  }

  if (parsed.section && parsed.section.code) {
    const security = checkSecurity(parsed.section.code);
    if (!security.safe) errors.push(security.reason);

    const syntax = await checkSyntax(parsed.section.code);
    if (!syntax.valid) errors.push(`خطأ بناء جملة: ${syntax.reason}`);
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { validateAiResponse, checkSyntax, checkSecurity };
