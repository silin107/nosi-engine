/**
 * orchestrator.js
 * -------------------------------------------------------
 * هذا هو "المحرك" الفعلي المفقود في النسخة الحالية من NOSI.
 * يستقبل رسالة المستخدم -> يبني البرومبت -> يستدعي Claude
 * -> يتحقق من الرد -> يحاول التصحيح تلقائيًا إن فشل -> يحدّث الشجرة.
 */

const { getProject, saveProject, appendMessage } = require("./contextManager");
const { buildSystemPrompt, buildUserPrompt } = require("./promptBuilder");
const { validateAiResponse } = require("./validator");
const { isValidSiteTreeShape } = require("./siteTreeSchema");

const MAX_RETRIES = 2;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = data.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
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

    const rawText = await callClaude(systemPrompt, userPrompt);
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
