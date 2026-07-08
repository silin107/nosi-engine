/**
 * contextManager.js
 * -------------------------------------------------------
 * إدارة حالة المشاريع: حفظ واسترجاع بيانات المشروع
 * (حاليًا باستخدام نظام الملفات، يمكن استبدالها بـ PostgreSQL لاحقًا)
 */

const fs = require("fs");
const path = require("path");
const { createEmptySiteTree } = require("./siteTreeSchema");

const PROJECTS_DIR = path.join(__dirname, "data", "projects");

// إنشاء مجلد البيانات إذا لم يكن موجودًا
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

/**
 * جلب مشروع من التخزين (أو إنشاء واحد جديد)
 */
function getProject(projectId) {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
  
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      console.error(`خطأ في قراءة المشروع ${projectId}:`, err);
      // إنشاء مشروع جديد في حالة الخطأ
    }
  }
  
  // إنشاء مشروع جديد
  const newProject = {
    id: projectId,
    siteTree: createEmptySiteTree(projectId),
    conversation: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  saveProject(projectId, newProject);
  return newProject;
}

/**
 * حفظ مشروع إلى التخزين
 */
function saveProject(projectId, projectData) {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
  
  try {
    // تحديث وقت التعديل
    projectData.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), "utf-8");
    console.log(`✅ تم حفظ المشروع: ${projectId}`);
  } catch (err) {
    console.error(`❌ خطأ في حفظ المشروع ${projectId}:`, err);
    throw err;
  }
}

/**
 * إضافة رسالة إلى سجل المحادثة
 */
function appendMessage(projectId, role, content) {
  const project = getProject(projectId);
  
  project.conversation.push({
    role, // "user" أو "assistant"
    content,
    timestamp: new Date().toISOString(),
  });
  
  saveProject(projectId, project);
}

/**
 * حذف مشروع (اختياري)
 */
function deleteProject(projectId) {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ تم حذف المشروع: ${projectId}`);
    } catch (err) {
      console.error(`❌ خطأ في حذف المشروع ${projectId}:`, err);
      throw err;
    }
  }
}

/**
 * قائمة جميع المشاريع (للإدارة)
 */
function listProjects() {
  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
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
