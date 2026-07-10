import type { Message } from "./ChatInterface";
import ToolBadge from "./ToolBadge";
import Citations from "./Citations";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} group`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 relative transition-all duration-300 ${
          isUser
            ? "bg-gradient-to-br from-cyan-600/90 to-blue-700/90 text-white rounded-br-sm shadow-[0_4px_20px_rgba(6,182,212,0.15)] backdrop-blur-md border border-cyan-500/30"
            : "bg-slate-800/60 text-slate-200 border border-slate-700/60 rounded-bl-sm shadow-[0_4px_15px_rgba(0,0,0,0.2)] backdrop-blur-md"
        }`}
      >
        {!isUser && message.tool_used && (
          <div className="mb-3">
            <ToolBadge tool={message.tool_used} />
          </div>
        )}

        {message.isLoading ? (
          <div className="flex space-x-2 items-center h-6 px-2">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_0.2s] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_0.4s] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap font-light leading-relaxed">{message.content}</div>
        )}

        {!isUser && message.sql_query && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]"></div>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Query Executed</p>
            </div>
            <pre className="bg-slate-900/80 p-3 rounded-lg text-xs text-purple-300 overflow-x-auto border border-purple-500/20 shadow-inner font-mono">
              <code>{message.sql_query}</code>
            </pre>
          </div>
        )}

        {!isUser && message.citations && message.citations.length > 0 && (
          <Citations citations={message.citations} />
        )}
      </div>
    </div>
  );
}
