import React from 'react';
import { Sparkles } from 'lucide-react';

export default function ChatMessages({ messages, loading }) {
  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 dir-rtl">
      {messages.length === 0 && (
        <div className="text-center text-slate-500 mt-12 text-sm leading-relaxed">
          <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-pulse" />
          مرحباً بك في <strong className="text-slate-300">NOSI Studio</strong>.<br />
          ابدأ بكتابة فكرتك لبناء وتطوير موقعك الإلكتر��ني فوراً.
        </div>
      )}
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
          <div
            className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-none'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {loading && (
        <div className="text-slate-400 text-xs flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-fit">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          NOSI Engine يقوم بتحليل وابتكار العناصر...
        </div>
      )}
    </div>
  );
}
