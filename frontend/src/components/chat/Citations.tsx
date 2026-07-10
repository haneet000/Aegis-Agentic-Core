import { useState } from "react";
import type { Citation } from "./ChatInterface";

export default function Citations({ citations }: { citations: Citation[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-700/30">
      <div className="flex items-center space-x-2 mb-3">
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Document Citations ({citations.length})</p>
      </div>
      <div className="space-y-2">
        {citations.map((cit, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={idx}
              className="bg-slate-900/40 rounded-xl border border-slate-700/30 hover:border-emerald-500/30 transition-all duration-200 overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-3 text-left focus:outline-none"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PDF DOC
                  </span>
                  <span className="text-xs font-medium text-slate-300 truncate font-mono">
                    {cit.source}
                  </span>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? "transform rotate-180 text-emerald-400" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`transition-all duration-200 ease-in-out ${isExpanded ? "max-h-60 border-t border-slate-800" : "max-h-0"}`}
                style={{ overflow: "hidden" }}
              >
                <div className="p-3 bg-slate-950/40 text-xs text-slate-400 font-sans italic leading-relaxed border-l-2 border-emerald-500">
                  "{cit.content}"
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
