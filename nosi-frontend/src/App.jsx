import React, { useEffect, useState, useRef } from 'react';
import ChatMessages from './components/ChatMessages.jsx';
import { api } from './lib/api.js';

export default function App() {
  const [projectId, setProjectId] = useState(() => {
    // attempt to read from URL or fallback to default demo id
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('project') || 'demo-project';
    } catch {
      return 'demo-project';
    }
  });

  const [siteTree, setSiteTree] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadProject(projectId);
    // focus input on mount
    inputRef.current?.focus();
  }, [projectId]);

  async function loadProject(id) {
    setError(null);
    setLoading(true);
    try {
      const res = await api.getProject(id);
      if (res && res.siteTree) setSiteTree(res.siteTree);
      // If backend returns conversation/messages, use them; otherwise create a starter message
      const initialMessages = (res.raw && res.raw.conversation) || [];
      setMessages(
        initialMessages.length > 0
          ? initialMessages
          : [
              { role: 'assistant', content: 'مرحباً! أخبرني ماذا تريد إنشاءه لموقعك.' },
            ]
      );
    } catch (err) {
      console.error('Failed to load project', err);
      setError('فشل تحميل المشروع');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const res = await api.sendChatMessage(projectId, text);
      const reply = res.reply || (res.raw && res.raw.reply) || 'تمت المعالجة.';
      const assistantMsg = { role: 'assistant', content: reply };
      setMessages((m) => [...m, assistantMsg]);

      if (res.siteTree) {
        setSiteTree(res.siteTree);
      }
    } catch (err) {
      console.error('sendChatMessage failed', err);
      setError('تعذّر إرسال الرسالة');
    } finally {
      setLoading(false);
    }
  }

  async function handleUndo() {
    setLoading(true);
    try {
      const res = await api.undo(projectId);
      if (res.siteTree) setSiteTree(res.siteTree);
    } catch (err) {
      console.error('undo failed', err);
      setError('فشل التراجع');
    } finally {
      setLoading(false);
    }
  }

  async function handleRedo() {
    setLoading(true);
    try {
      const res = await api.redo(projectId);
      if (res.siteTree) setSiteTree(res.siteTree);
    } catch (err) {
      console.error('redo failed', err);
      setError('فشل الإعادة');
    } finally {
      setLoading(false);
    }
  }

  function renderPreview() {
    if (!siteTree) {
      return (
        <div className="p-6 text-slate-400">لم يتم تحميل معاينة الموقع بعد.</div>
      );
    }

    // Simple structured preview: list pages and sections and render section.code as text
    return (
      <div className="p-4 space-y-4">
        <div className="text-sm text-slate-400">Theme: {siteTree.theme?.name || 'default'}</div>
        {siteTree.pages?.map((page) => (
          <div key={page.id} className="border rounded-lg p-3 bg-slate-900/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{page.title || page.id}</div>
                <div className="text-xs text-slate-500">{page.path || '/'+page.id}</div>
              </div>
              <div className="text-xs text-slate-400">{page.sections?.length || 0} sections</div>
            </div>

            <div className="mt-3 space-y-2">
              {page.sections?.map((s) => (
                <div key={s.id} className="bg-slate-800 p-3 rounded">
                  <div className="text-xs text-slate-300 font-medium">{s.type} — {s.id}</div>
                  <pre className="mt-2 max-h-48 overflow-auto text-xs bg-slate-900 p-2 rounded text-slate-200">{s.code || '—'}</pre>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded flex items-center justify-center font-bold">N</div>
          <div>
            <div className="font-semibold">NOSI Studio</div>
            <div className="text-xs text-slate-500">بناء مواقع عبر المحادثة</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleUndo} className="px-3 py-1 bg-slate-800 rounded text-xs">تراجع</button>
          <button onClick={handleRedo} className="px-3 py-1 bg-slate-800 rounded text-xs">إعادة</button>
          <a href={api.getExportUrl(projectId)} className="px-3 py-1 bg-indigo-600 rounded text-xs">تصدير</a>
        </div>
      </header>

      <main className="flex-1 flex">
        {/* Left: Toolbar (compact) */}
        <aside className="w-16 border-r border-slate-800 p-2 flex flex-col items-center gap-3 bg-slate-900/30">
          <button title="Pages" className="w-10 h-10 rounded bg-slate-800/60">📄</button>
          <button title="Sections" className="w-10 h-10 rounded bg-slate-800/60">🔧</button>
          <button title="Themes" className="w-10 h-10 rounded bg-slate-800/60">🎨</button>
        </aside>

        {/* Center: Preview */}
        <section className="flex-1 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg">معاينة الموقع</h2>
            <div className="text-xs text-slate-500">Project: {projectId}</div>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
            {renderPreview()}
          </div>
        </section>

        {/* Right: Chat */}
        <aside className="w-96 border-l border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-800">
            <div className="font-semibold">محادثة البناء</div>
            <div className="text-xs text-slate-500">اطرح أوامر للتعديل على شجرة الموقع</div>
          </div>

          <div className="flex-1 flex flex-col">
            <ChatMessages messages={messages} loading={loading} />

            <div className="p-3 border-t border-slate-800">
              {error && <div className="text-xs text-red-400 mb-2">{error}</div>}

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="اكتب طلبك هنا..."
                  className="flex-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="px-3 py-2 bg-indigo-600 rounded text-sm disabled:opacity-50"
                >
                  إرسال
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="p-3 text-xs text-slate-500 border-t border-slate-800 text-center">NOSI Studio — نسخة تجريبية</footer>
    </div>
  );
}
