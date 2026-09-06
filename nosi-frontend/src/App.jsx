import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from './lib/api';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import PreviewPane from './components/PreviewPane';

const PROJECT_ID = 'default-project';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [siteTree, setSiteTree] = useState(null);

  useEffect(() => {
    loadInitialProject();
  }, []);

  const loadInitialProject = async () => {
    try {
      const data = await api.getProject(PROJECT_ID);
      if (data?.siteTree) setSiteTree(data.siteTree);
    } catch (err) {
      console.error('فشل جلب بيانات المشروع:', err);
    }
  };

  const handleSendMessage = async (text) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const data = await api.sendChatMessage(PROJECT_ID, text);
      if (data?.siteTree) setSiteTree(data.siteTree);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'تم تحديث الواجهة بنجاح بناءً على طلبك.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'تعذر الاتصال بالمحرك، يرجى التأكد من تشغيل الخادم.' },
      ]);
    } finally {
      setLoading(false);
    }

  };

  const handleUndo = async () => {
    try {
      const data = await api.undo(PROJECT_ID);
      if (data?.siteTree) setSiteTree(data.siteTree);
    } catch (err) {
      console.error('فشل عملية التراجع:', err);
    }
  };

  const handleRedo = async () => {
    try {
      const data = await api.redo(PROJECT_ID);
      if (data?.siteTree) setSiteTree(data.siteTree);
    } catch (err) {
      console.error('فشل عملية الإعادة:', err);
    }
  };

  const handleExport = () => {
    window.open(api.getExportUrl(PROJECT_ID), '_blank');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans antialiased dir-rtl">
      <div className="w-96 border-l border-slate-800 flex flex-col bg-slate-950">
        <header className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h1 className="font-bold text-base text-slate-100">NOSI Studio</h1>
          </div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
            v1.0 ESM
          </span>
        </header>

        <ChatMessages messages={messages} loading={loading} />
        <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
      </div>

      <PreviewPane
        siteTree={siteTree}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
      />
    </div>
  );
}
