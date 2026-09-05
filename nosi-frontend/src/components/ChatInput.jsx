import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSendMessage, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 flex gap-2 bg-slate-950">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="صف التعديل المطلوب على الواجهة..."
        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
      />
      <button
        type="submit"
        disabled={disabled}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
      >
        <Send className="w-4 h-4 rotate-180" />
      </button>
    </form>
  );
}
