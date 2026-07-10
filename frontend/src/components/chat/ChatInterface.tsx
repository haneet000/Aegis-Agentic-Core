"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

export type Citation = { source: string; content: string };

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool_used?: "RAG" | "SQL" | "BOTH" | "FALLBACK";
  citations?: Citation[];
  sql_query?: string;
  isLoading?: boolean;
};

type Tab = "docs" | "schema";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("docs");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [backendStatus, setBackendStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://aegis-agentic-core.onrender.com/api";
        const res = await fetch(`${apiBaseUrl.replace("/api", "")}/docs`, { method: "HEAD" });
        if (res.ok || res.status === 404 || res.status === 200) {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      } catch (e) {
        setBackendStatus("offline");
      }
    };
    checkBackend();
  }, []);

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== "string") {
      e.preventDefault();
    }
    const queryText = typeof e === "string" ? e : input;
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: queryText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const tempId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "assistant", content: "", isLoading: true },
    ]);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://aegis-agentic-core.onrender.com/api";
      const res = await fetch(`${apiBaseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!res.ok) throw new Error("Failed to fetch");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("No reader");

      let currentText = "";
      let buffer = "";
      
      const processMessage = (message: string) => {
        if (message.startsWith("data: ")) {
          const dataStr = message.slice(6).trim();
          if (dataStr === "[DONE]") return;
          
          try {
            const data = JSON.parse(dataStr);
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === tempId) {
                  if (data.type === "tool") {
                    return { ...msg, tool_used: data.tool_used };
                  } else if (data.type === "chunk") {
                    currentText += data.content;
                    return { ...msg, content: currentText, isLoading: false };
                  } else if (data.type === "metadata") {
                    return { 
                      ...msg, 
                      citations: data.citations || msg.citations, 
                      sql_query: data.sql_query || msg.sql_query,
                      isLoading: false 
                    };
                  }
                }
                return msg;
              })
            );
          } catch (e) {
            console.error("Error parsing SSE data", e, dataStr);
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            processMessage(buffer);
          }
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const message = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          if (message) {
            processMessage(message);
          }
          boundary = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                content: "Error communicating with the mainframe.",
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQueries = [
    { label: "Pending Orders", text: "Show me all orders that are currently pending" },
    { label: "Return Policy", text: "What is the return policy and how many days do I have?" },
    { label: "Hybrid check", text: "Who bought ORD-1001 and what is the warranty policy for their product?" },
  ];

  return (
    <div className="flex h-full w-full border border-slate-800/80 rounded-3xl overflow-hidden bg-slate-950 shadow-[0_12px_60px_rgba(0,0,0,0.6)] relative">
      
      {/* LEFT SIDEBAR: System Diagnostics (Schema & Docs) */}
      <div 
        className={`bg-slate-900/60 border-r border-slate-800/60 backdrop-blur-xl flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "w-80" : "w-0"
        } overflow-hidden flex-shrink-0 relative hidden md:flex`}
      >
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              backendStatus === "online" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" : 
              backendStatus === "connecting" ? "bg-amber-500 animate-ping" : 
              "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
            }`} />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">System Inspector</h2>
          </div>
          <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700/50">
            {backendStatus.toUpperCase()}
          </span>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-800/80 p-2 space-x-1">
          <button
            onClick={() => setActiveTab("docs")}
            className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
              activeTab === "docs"
                ? "bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-inner"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Vector RAG
          </button>
          <button
            onClick={() => setActiveTab("schema")}
            className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
              activeTab === "schema"
                ? "bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-inner"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            SQLite Schema
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px]">
          {activeTab === "docs" ? (
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Indexed Knowledge Base</div>
              
              {[
                { name: "returns_policy.pdf", desc: "Refund timelines & conditions" },
                { name: "warranty_policy.pdf", desc: "Hardware & support terms" },
                { name: "hr_leave_policy.pdf", desc: "Company employee guidelines" },
                { name: "pricing_discounts_policy.pdf", desc: "Bulk buys & pricing rules" },
                { name: "product_faq.pdf", desc: "Common client Q&As" }
              ].map((doc, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl hover:border-emerald-500/20 transition-all duration-300">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{doc.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-sans">{doc.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Table: orders</div>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                  {[
                    { col: "order_id", type: "TEXT (PK)" },
                    { col: "customer", type: "TEXT" },
                    { col: "product", type: "TEXT" },
                    { col: "amount", type: "REAL" },
                    { col: "status", type: "TEXT" },
                    { col: "order_date", type: "TEXT (YYYY-MM-DD)" }
                  ].map((field, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] border-b border-slate-800/40 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-purple-400 font-bold">{field.col}</span>
                      <span className="text-slate-500 text-[9px]">{field.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Chat Console */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/20 relative">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>

        {/* Console Header */}
        <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800/40 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-400 hover:text-cyan-400 p-1 rounded-lg hover:bg-slate-800/50 transition-all duration-200 hidden md:block"
              title="Toggle System Inspector"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-300 font-mono">Chat Console</span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse"></span>
            <span>SECURE LINK TERMINAL</span>
          </div>
        </div>

        {/* Message Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-6">
              <div className="relative">
                <svg
                  className="w-16 h-16 text-cyan-500/40 animate-[pulse_3s_ease-in-out_infinite]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div className="absolute inset-0 bg-cyan-500/10 blur-2xl rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-widest uppercase text-cyan-500/70 font-mono">Terminal Awaiting Query</p>
                <p className="text-xs text-slate-500 font-light mt-2 max-w-xs mx-auto leading-relaxed">
                  Query the unstructured RAG vector store policies, perform SQL lookups, or ask hybrid questions.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Quick Action Sample Chips */}
        {messages.length === 0 && (
          <div className="px-6 py-2 flex flex-wrap gap-2 justify-center z-10">
            {sampleQueries.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(chip.text)}
                className="text-[11px] font-sans font-medium text-slate-400 bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 hover:text-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)] px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar Panel */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-900 backdrop-blur-md z-10">
          <form
            onSubmit={handleSubmit}
            className="flex items-center space-x-3 bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-2xl focus-within:border-cyan-500/30 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300"
          >
            <div className="text-cyan-500 flex-shrink-0 animate-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-slate-200 placeholder-slate-500 text-xs md:text-sm font-sans"
              placeholder="Initialize search or database query sequence..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="text-cyan-400 p-2 rounded-xl hover:bg-cyan-950/50 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all duration-300 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
