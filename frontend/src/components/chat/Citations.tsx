import type { Citation } from "./ChatInterface";

export default function Citations({ citations }: { citations: Citation[] }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-700/50">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Data Sources</p>
      </div>
      <div className="space-y-3">
        {citations.map((cit, idx) => (
          <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-emerald-500/20 shadow-inner group-hover:border-emerald-500/40 transition-colors duration-300">
            <p className="text-[10px] font-bold text-emerald-500 mb-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {cit.source}
            </p>
            <p className="text-xs text-emerald-200/70 font-mono leading-relaxed line-clamp-3 hover:line-clamp-none transition-all duration-300 cursor-default" title={cit.content}>
              "{cit.content}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
