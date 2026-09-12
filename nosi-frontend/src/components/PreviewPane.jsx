import React from 'react';
import { Play } from 'lucide-react';

export default function PreviewPane({ siteTree }) {
  return (
    <div className="flex-1 bg-slate-900 p-6 overflow-y-auto flex flex-col h-full">
      <div className="flex items-center mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
          المعاينة الحية (Live Preview)
        </div>
      </div>
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto font-mono text-xs">
        {siteTree ? (
          <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed text-left" dir="ltr">
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
