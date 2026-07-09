/**
 * contextManager.js
 * -------------------------------------------------------
 * إدارة حالة المشاريع: حفظ واسترجاع بيانات المشروع
 * (حاليًا باستخدام نظام الملفات، يمكن استبدالها بـ PostgreSQL لاحقًا)
 */

const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { createEmptySiteTree } = require("./siteTreeSchema");

const PROJECTS_DIR = path.join(__dirname, "data", "projects");

// إنشاء مجلد البيانات إذا لم يكن موجودًا
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// خريطة لتسلسل العمليات لكل مشروع (قفل بسيط لكل مشروع)
const projectLocks = new Map();

function runExclusive(projectId, fn) {
  const prev = projectLocks.get(projectId) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(() => fn())
    .finally(() => {
      // إزالة القفل إذا كان لا يوجد عمليات لاحقة
      if (projectLocks.get(projectId) === next) projectLocks.delete(projectId);
    });
  projectLocks.set(projectId, next);
  return next;
}

/**
 * جلب مشروع من التخزين (أو إنشاء واحد جديد)
 */
async function getProject(projectId) {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);

  try {
    await fsPromises.access(filePath, fs.constants.F_OK);
    const data = await fsPromises.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    // لو الملف غير موجود أو فشل القراءة، ننشئ مشروع جديد
    console.warn(`Project ${projectId} not found or unreadable, creating new one.`);
  }

  // إنشاء مشروع جديد
  const newProject = {
    id: projectId,
    siteTree: createEmptySiteTree(projectId),
    conversation: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveProject(projectId, newProject);
  return newProject;
}

/**
 * حفظ مشروع إلى التخزين (آمن على التوازي per-project)
 */
async function saveProject(projectId, projectData) {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
  const tempPath = `${filePath}.tmp`;

  return runExclusive(projectId, async () => {
    try {
      // تحديث وقت التعديل
      projectData.updatedAt = new Date().toISOString();

      // اكتب إلى ملف مؤقت ثم استبدل لتحسين الذرَفية
      await fsPromises.writeFile(tempPath, JSON.stringify(projectData, null, 2), "utf-8");
      await fsPromises.rename(tempPath, filePath);
      console.info(`✅ تم حفظ المشروع: ${projectId}`);
      return true;
    } catch (err) {
      console.error(`❌ خطأ في حفظ المشروع ${projectId}:`, err);
      // حذف الملف المؤقت إن وُجد
      try {
        if (await fsPromises.access(tempPath).then(() => true).catch(() => false)) {
          await fsPromises.unlink(tempPath).catch(() => {});
        }
      } catch (_) {}
      throw err;
    }
  });
}

/**
 * إضافة رسالة إلى سجل المحادثة
 */
async function appendMessage(projectId, role, content) {
  // احصل على المشروع الحالي، ثم أضف الرسالة واحفظ
  const project = await getProject(projectId);

  project.conversation.push({
    role, // "user" أو "assistant"
    content,
    timestamp: new Date().toISOString(),
  });

  try {
    await saveProject(projectId, project);
  } catch (err) {
    console.error(`خطأ أثناء إضافة رسالة للمشروع ${projectId}:`, err);
    // لا نعيد رمي الخطأ حتى لا يسقط خادم الويب؛ سجلنا الخطأ فقط
  }
}

/**
 * حذف مشروع (اختياري)
 */
async function deleteProject(projectId) {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);

  try {
    if (await fsPromises.access(filePath).then(() => true).catch(() => false)) {
      await fsPromises.unlink(filePath);
      console.info(`✅ تم حذف المشروع: ${projectId}`);
    }
  } catch (err) {
    console.error(`❌ خطأ في حذف المشروع ${projectId}:`, err);
    throw err;
  }
}

/**
 * قائمة جميع المشاريع (للإدارة)
 */
async function listProjects() {
  try {
    const files = await fsPromises.readdir(PROJECTS_DIR);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
  } catch (err) {
    console.error("خطأ في قائمة المشاريع:", err);
    return [];
  }
}

module.exports = {
  getProject,
  saveProject,
  appendMessage,
  deleteProject,
  listProjects,
};
