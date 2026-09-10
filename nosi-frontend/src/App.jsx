import React, { useState, useEffect } from 'react';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import PreviewPane from './components/PreviewPane';
import { api } from './lib/api';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [siteTree, setSiteTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const projectId = 'demo';

  // جلب معلومات المشروع عند تشغيل التطبيق
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await api.getProject(projectId);
        if (res?.siteTree) {
          setSiteTree(res.siteTree);
        }
      } catch (err) {
        console.error('حدث خطأ أثناء تحميل المشروع:', err);
      }
    }
    loadProject();
  }, []);

  // إرسال رسالة جديدة للذكاء الاصطناعي
  const handleSendMessage = async (text) => {
    if (!text || !text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.sendChatMessage(projectId, text);
      if (response?.siteTree) {
        setSiteTree(response.siteTree);
      }
      const replyMessage = response?.reply || 'تم تحديث شجرة الموقع بنجاح.';
      setMessages((prev) => [...prev, { role: 'assistant', content: replyMessage }]);
    } catch (error) {
      console.error('خطأ في التواصل مع المحرك:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'حدث خطأ أثناء الاتصال بالخادم.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // زر التراجع
  const handleUndo = async () => {
    try {
      const res = await api.undo(projectId);
      if (res?.siteTree) setSiteTree(res.siteTree);
    } catch (err) {
      console.error('خطأ في التراجع:', err);
    }
  };

  // زر الإعادة
  const handleRedo = async () => {
    try {
      const res = await api.redo(projectId);
      if (res?.siteTree) setSiteTree(res.siteTree);
    } catch (err) {
      console.error('خطأ في الإعادة:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans dir-rtl">
      {/* لوحة المحادثة الجانبية */}
      <div className="w-[380px] flex flex-col border-l border-slate-800 bg-slate-900/90 shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <h1 className="font-bold text-lg text-indigo-400">NOSI Studio</h1>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleUndo}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              تراجع
            </button>
            <button
              onClick={handleRedo}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              إعادة
            </button>
            <a
              href={api.getExportUrl(projectId)}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              تصدير
            </a>
          </div>
        </div>

        <ChatMessages messages={messages} loading={loading} />

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        </div>
      </div>

      {/* منطقة المعاينة الحية */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        <PreviewPane siteTree={siteTree} />
      </div>
    </div>
  );
}
