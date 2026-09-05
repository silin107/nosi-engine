import React from 'react';
import { Undo, Redo, Download, Play } from 'lucide-react';

export default function PreviewPane({ siteTree, onUndo, onRedo, onExport }) {
  return (
    <div className="flex-1 bg-slate-900 p-6 overflow-y-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20" /> المعاينة الحية (Live Preview)
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onUndo} title="تراجع" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={onRedo} title="إعادة" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer">
            <Redo className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1px] bg-slate-800 mx-1" />
          <button onClick={onExport} title="تصدير الكود" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs text-indigo-400 font-medium cursor-pointer">
            <Download className="w-4 h-4" /> تصدير
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto font-mono text-xs">
        {siteTree ? (
          <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed dir-ltr text-left">
            {JSON.stringify(siteTree, null, 2)}
          </pre>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm">
            جاري تحميل شجرة الموقع من المحرك...
          </div>
        )}
      </div>
    </div>
  );
}
