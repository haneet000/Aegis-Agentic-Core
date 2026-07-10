import { useState } from "react";
import type { Message } from "./ChatInterface";
import ToolBadge from "./ToolBadge";
import Citations from "./Citations";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (message.sql_query) {
      navigator.clipboard.writeText(message.sql_query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-start space-x-3 w-full ${isUser ? "justify-end" : "justify-start"} group animate-fade-in`}>
      {/* Avatar for Assistant */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
          <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-5 py-4 relative transition-all duration-300 ${
          isUser
            ? "bg-gradient-to-br from-cyan-600/90 to-blue-700/90 text-white rounded-tr-none shadow-[0_4px_25px_rgba(6,182,212,0.15)] border border-cyan-400/20"
            : "bg-slate-900/50 text-slate-100 border border-slate-700/50 rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md"
        }`}
      >
        {!isUser && message.tool_used && (
          <div className="mb-3.5">
            <ToolBadge tool={message.tool_used} />
          </div>
        )}

        {message.isLoading ? (
          <div className="flex space-x-2 items-center h-6 px-1">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
          </div>
        ) : (
          <div className="whitespace-pre-wrap font-sans text-[13px] md:text-sm font-normal leading-relaxed text-slate-200">{message.content}</div>
        )}

        {!isUser && message.sql_query && (
          <div className="mt-4 pt-3.5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]"></div>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">SQLite Pipeline</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-cyan-400 transition-colors duration-150 px-2 py-0.5 rounded bg-slate-800/40 border border-slate-700/50"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-950 p-3.5 rounded-xl text-xs text-purple-300 overflow-x-auto border border-purple-500/10 shadow-inner font-mono max-w-full">
              <code>{message.sql_query}</code>
            </pre>
          </div>
        )}

        {!isUser && message.citations && message.citations.length > 0 && (
          <Citations citations={message.citations} />
        )}
      </div>

      {/* Avatar for User */}
      {isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
}
