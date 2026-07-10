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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
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
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!res.ok) throw new Error("Failed to fetch");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("No reader");

      let currentText = "";
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") break;
            
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

  return (
    <div className="flex flex-col h-full w-full border border-slate-700/50 rounded-2xl overflow-hidden bg-slate-900/40 backdrop-blur-xl shadow-[0_0_40px_rgba(30,58,138,0.15)] relative">
      {/* Decorative top border glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-cyan-500/50">
            <div className="relative">
              <svg
                className="w-20 h-20 mb-6 animate-[pulse_4s_ease-in-out_infinite]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
            </div>
            <p className="text-lg font-light tracking-wide">SYSTEM STANDBY...</p>
            <p className="text-xs mt-2 text-slate-500">AWAITING QUERY INPUT</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 backdrop-blur-md">
        <form
          onSubmit={handleSubmit}
          className="flex items-center space-x-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300"
        >
          <div className="text-cyan-500 flex-shrink-0 animate-pulse">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-slate-200 placeholder-slate-500 py-1 font-light"
            placeholder="Initialize query sequence..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="text-cyan-400 p-2 rounded-lg hover:bg-cyan-950/50 hover:text-cyan-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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
  );
}
