export default function ToolBadge({ tool }: { tool: "RAG" | "SQL" | "BOTH" | "FALLBACK" }) {
  const getBadgeStyle = () => {
    switch (tool) {
      case "RAG":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
      case "SQL":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
      case "BOTH":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]";
      case "FALLBACK":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getLabel = () => {
    switch (tool) {
      case "RAG": return "NEURAL RETRIEVAL";
      case "SQL": return "STRUCT QUERY";
      case "BOTH": return "HYBRID MODE";
      case "FALLBACK": return "SAFE MODE";
      default: return tool;
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-sm border ${getBadgeStyle()} backdrop-blur-sm`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-2 shadow-[0_0_5px_currentColor]"></div>
      <span className="text-[9px] font-bold tracking-[0.2em]">{getLabel()}</span>
    </div>
  );
}
