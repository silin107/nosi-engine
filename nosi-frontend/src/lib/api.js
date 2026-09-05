const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export const api = {
  async getProject(projectId) {
    const res = await fetch(`${API_BASE}/project/${projectId}`);
    return res.json();
  },
  async sendChatMessage(projectId, message) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, message }),
    });
    return res.json();
  },
  async undo(projectId) {
    const res = await fetch(`${API_BASE}/project/${projectId}/undo`, { method: 'POST' });
    return res.json();
  },
  async redo(projectId) {
    const res = await fetch(`${API_BASE}/project/${projectId}/redo`, { method: 'POST' });
    return res.json();
  },
  getExportUrl(projectId) {
    return `${API_BASE}/project/${projectId}/export`;
  }
};
