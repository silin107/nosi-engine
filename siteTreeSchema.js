/**
 * siteTreeSchema.js
 * -------------------------------------------------------
 * هذا هو "العقل" الذي يمثّل حالة الموقع بشكل منظم (وليس نص محادثة).
 * كل موقع = مجموعة صفحات، كل صفحة = مجموعة أقسام (sections)،
 * كل قسم = مكوّن React له خصائص (props) وكود.
 *
 * الفكرة: بدل أن يولّد الذكاء الاصطناعي "موقع كامل" كل مرة،
 * هو يعدّل عقدة واحدة فقط في هذه الشجرة.
 */

function createEmptySiteTree(projectName) {
  return {
    projectName,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    theme: {
      primaryColor: "#4f46e5",
      font: "Inter",
    },
    pages: [
      {
        id: "home",
        path: "/",
        title: "الرئيسية",
        sections: [], // كل عنصر: { id, type, code, props }
      },
    ],
  };
}

/**
 * يتحقق أن الشجرة القادمة من الذكاء الاصطناعي لا تخالف الشكل المتوقع
 * (فحص بنيوي أولي، قبل الفحص التقني في validator.js)
 */
function isValidSiteTreeShape(tree) {
  if (!tree || typeof tree !== "object") return false;
  if (!Array.isArray(tree.pages)) return false;
  return tree.pages.every(
    (p) =>
      typeof p.id === "string" &&
      typeof p.path === "string" &&
      Array.isArray(p.sections)
  );
}

module.exports = { createEmptySiteTree, isValidSiteTreeShape };
