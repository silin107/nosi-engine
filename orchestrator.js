const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateWithOpenRouter } = require("./openrouterService.js");

// تشغيل عميل Gemini الأساسي للمشروع
const geminiClient = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

const handleAIRequest = async (taskType, prompt, systemInstruction) => {
  switch (taskType) {
    case 'CODE_GENERATION':
      return await generateWithOpenRouter('anthropic/claude-3.5-sonnet', prompt, systemInstruction);

    case 'DEBUG_AND_FIX':
      return await generateWithOpenRouter('openai/gpt-4o', prompt, systemInstruction);

    default:
      // عند اختيار افتراضي يرجع لنظام Gemini الحالي لديك
      break;
  }
};
// في أعلى ملف orchestrator.js
import { generateWithOpenRouter } from './openrouterService.js';

// داخل دالة التوجيه الموجودة في orchestrator.js أضف أو عدّل النماذج:
export const handleAIRequest = async (taskType, prompt, systemInstruction) => {
  switch (taskType) {
    case 'CODE_GENERATION':
      // استدعاء Claude 3.5 Sonnet عبر OpenRouter
      return await generateWithOpenRouter('anthropic/claude-3.5-sonnet', prompt, systemInstruction);

    case 'DEBUG_AND_FIX':
      // استدعاء GPT-4o عبر OpenRouter
      return await generateWithOpenRouter('openai/gpt-4o', prompt, systemInstruction);

    default:
      // استخدام Gemini كما هو معتمد في كودك الحالي
      break;
  }
};
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
  // getProject is async — await it to obtain the actual project object
  const project = await getProject(projectId);

  // Ensure the user's message is appended before proceeding (avoid races)
  await appendMessage(projectId, "user", userMessage);

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
    // await saving and appending to avoid unhandled promise rejections / races
    await saveProject(projectId, project);
    await appendMessage(projectId, "assistant", parsed.explanation || "تم التعديل");

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

module.exports = { handleUserMessage, handleAIRequest };
