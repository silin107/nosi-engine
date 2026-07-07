/**
 * server.js
 * -------------------------------------------------------
 * نقاط الوصول (API) التي تربط واجهة NOSI (Base44 frontend)
 * بالمحرك الفعلي. استدعِ /api/chat من الواجهة الأمامية بدل
 * أي استدعاء مباشر للـ AI حاليًا.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { handleUserMessage } = require("./lib/orchestrator");
const { getProject } = require("./lib/contextManager");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// المستخدم يرسل رسالته هنا؛ نرجع التعديل + الشجرة المحدثة للمعاينة
app.post("/api/chat", async (req, res) => {
  const { projectId, message } = req.body;
  if (!projectId || !message) {
    return res.status(400).json({ error: "projectId و message مطلوبان" });
  }

  try {
    const result = await handleUserMessage(projectId, message);
    if (!result.success) return res.status(422).json(result);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "خطأ داخلي في المحرك", details: err.message });
  }
});

// جلب حالة المشروع كاملة (للمعاينة الحية عند فتح الصفحة)
app.get("/api/project/:projectId", (req, res) => {
  const project = getProject(req.params.projectId);
  res.json(project);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ NOSI Engine يعمل على المنفذ ${PORT}`);
});
