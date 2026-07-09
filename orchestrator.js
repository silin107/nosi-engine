/**
 * orchestrator.js
 * -------------------------------------------------------
 * هذا هو "المحرك" الفعلي المفقود في النسخة الحالية من NOSI.
 * يستقبل رسالة المستخدم -> يبني البرومبت -> يستدعي Gemini
 * -> يتحقق من الرد -> يحاول التصحيح تلقائيًا إن فشل -> يحدّث الشجرة.
 */

const { getProject, saveProject, appendMessage } = require("./contextManager");
const { buildSystemPrompt, buildUserPrompt } = require("./promptBuilder");
const { validateAiResponse } = require("./validator");
const { isValidSiteTreeShape } = require("./siteTreeSchema");

const MAX_RETRIES = 2;
const GEMINI_MODEL = "gemini-2.5-flash";

// Gemini SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

// instantiate client once; requires GEMINI_API_KEY in env
const geminiClient = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

async function callGemini(systemPrompt, userPrompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // combine the prompts similarly to prior usage
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

  // get the model and generate content
  const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent({
    text: combinedPrompt,
    // keep tokens conservative; adjust as needed in production
    max_output_tokens: 4000,
    temperature: 0.0,
  });

  // normalize several possible response shapes from SDK
  const response = result?.response;
  if (!response) throw new Error("No response from Gemini model");

  // response.text() is commonly available; fall back to other fields if needed
  if (typeof response.text === "function") {
    return response.text();
  }
  if (typeof response.output_text === "string") {
    return response.output_text;
  }
  // If the SDK returned structured output, try to join text pieces
  if (Array.isArray(response.output)) {
    return response.output.map((o) => o.content || o.text || "").join("\n").trim();
  }

  // Last resort: stringify the response object
  return JSON.stringify(response);
}

function safeParseJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * يطبّق التعديل المعتمد على شجرة الموقع الفعلية
 */
function applyActionToTree(siteTree, parsed) {
  const page = siteTree.pages.find((p) => p.id === parsed.pageId) || siteTree.pages[0];

  switch (parsed.action) {
    case "add_section":
      page.sections.push(parsed.section);
      break;
    case "update_section": {
      const idx = page.sections.findIndex((s) => s.id === parsed.section.id);
      if (idx >= 0) page.sections[idx] = parsed.section;
      else page.sections.push(parsed.section);
      break;
    }
    case "delete_section":
      page.sections = page.sections.filter((s) => s.id !== parsed.section.id);
      break;
    case "update_theme":
      siteTree.theme = { ...siteTree.theme, ...parsed.section.props };
      break;
    case "add_page":
      siteTree.pages.push({
        id: parsed.section.id,
        path: parsed.section.props?.path || `/${parsed.section.id}`,
        title: parsed.section.props?.title || parsed.section.id,
        sections: [],
      });
      break;
  }
  return siteTree;
}

/**
 * نقطة الدخول الرئيسية: يُستدعى من server.js لكل رسالة من المستخدم
 */
async function handleUserMessage(projectId, userMessage) {
  const project = getProject(projectId);
  appendMessage(projectId, "user", userMessage);

  const systemPrompt = buildSystemPrompt();
  let lastErrors = [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const userPrompt = buildUserPrompt({
      userMessage:
        attempt === 0
          ? userMessage
          : `${userMessage}\n\n(تصحيح مطلوب، الأخطاء السابقة: ${lastErrors.join("; ")})`,
      siteTree: project.siteTree,
      recentConversation: project.conversation.slice(-6),
    });

    const rawText = await callGemini(systemPrompt, userPrompt);
    const parsed = safeParseJson(rawText);

    if (!parsed) {
      lastErrors = ["الرد لم يكن JSON صالحًا"];
      continue;
    }

    const validation = await validateAiResponse(parsed);
    if (!validation.ok) {
      lastErrors = validation.errors;
      continue;
    }

    // كل شيء سليم -> نطبّق التعديل ونحفظ
    const updatedTree = applyActionToTree(project.siteTree, parsed);
    if (!isValidSiteTreeShape(updatedTree)) {
      lastErrors = ["الشجرة الناتجة غير متوافقة مع الشكل المتوقع"];
      continue;
    }

    project.siteTree = updatedTree;
    saveProject(projectId, project);
    appendMessage(projectId, "assistant", parsed.explanation || "تم التعديل");

    return {
      success: true,
      explanation: parsed.explanation,
      siteTree: updatedTree,
    };
  }

  return {
    success: false,
    error: "تعذر توليد كود صالح بعد عدة محاولات",
    details: lastErrors,
  };
}

module.exports = { handleUserMessage };
