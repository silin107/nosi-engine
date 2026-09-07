// nosi-frontend/src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function safeJsonResponse(res) {
  let body = null;
  try {
    body = await res.json();
  } catch (err) {
    return { siteTree: null, raw: null };
  }

  const siteTree = body?.siteTree ?? body?.data?.siteTree ?? (body && (body.pages || body.theme) ? body : null);
  return { siteTree, raw: body };
}

export const api = {
  async getProject(projectId) {
    const res = await fetch(`${API_BASE}/project/${projectId}`);
    return await safeJsonResponse(res);
  },

  async sendChatMessage(projectId, message) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, message }),
    });
    const parsed = await safeJsonResponse(res);
    const reply = parsed.raw?.reply ?? parsed.raw?.message ?? null;
    return { ...parsed, reply };
  },

  async undo(projectId) {
    const res = await fetch(`${API_BASE}/project/${projectId}/undo`, { method: 'POST' });
    return await safeJsonResponse(res);
  },

  async redo(projectId) {
    const res = await fetch(`${API_BASE}/project/${projectId}/redo`, { method: 'POST' });
    return await safeJsonResponse(res);
  },

  getExportUrl(projectId) {
    return `${API_BASE}/project/${projectId}/export`;
  },
};
