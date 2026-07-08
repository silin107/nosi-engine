/**
 * siteTreeSchema.js - تحسينات
 * -------------------------------------------------------
 * تحسين نموذج البيانات وإضافة مزيد من الفحوصات
 */

function createEmptySiteTree(projectName) {
  return {
    projectName,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    theme: {
      primaryColor: "#4f46e5",
      secondaryColor: "#ec4899",
      font: "Inter",
      fontFamily: "font-sans",
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
  if (!tree.theme || typeof tree.theme !== "object") return false;

  const isValidPage = (p) =>
    typeof p.id === "string" &&
    typeof p.path === "string" &&
    Array.isArray(p.sections) &&
    p.sections.every(
      (s) =>
        typeof s.id === "string" &&
        typeof s.type === "string" &&
        (typeof s.code === "string" || !s.code) && // الكود اختياري
        (!s.props || typeof s.props === "object")
    );

  return tree.pages.every(isValidPage);
}

/**
 * إصلاح الشجرة إذا كانت بها مشاكل
 */
function sanitizeSiteTree(tree) {
  if (!tree) return createEmptySiteTree("default");

  // التأكد من وجود الحقول الأساسية
  tree.version = tree.version || 1;
  tree.createdAt = tree.createdAt || new Date().toISOString();
  tree.updatedAt = new Date().toISOString();

  if (!tree.theme) {
    tree.theme = createEmptySiteTree("temp").theme;
  }

  if (!Array.isArray(tree.pages)) {
    tree.pages = [{
      id: "home",
      path: "/",
      title: "الرئيسية",
      sections: [],
    }];
  }

  return tree;
}

module.exports = {
  createEmptySiteTree,
  isValidSiteTreeShape,
  sanitizeSiteTree,
};
