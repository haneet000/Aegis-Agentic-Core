import ChatInterface from "@/components/chat/ChatInterface";

export default function Home() {
  return (
    <main className="fixed inset-0 bg-slate-950 text-slate-200 p-4 md:p-8 flex flex-col items-center">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto mb-8 md:mb-12 mt-4 md:mt-8 text-center z-10 flex-shrink-0 relative">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 tracking-tight drop-shadow-sm">
          Aegis Agentic Core
        </h1>
        <p className="text-slate-400 font-light max-w-2xl mx-auto text-xs md:text-sm leading-relaxed tracking-wide">
          Dual-mode routing initialized. Capable of unstructured data parsing & structured relational queries. Awaiting input.
        </p>
      </div>
      
      <div className="w-full max-w-5xl z-10 relative flex-1 min-h-0">
        <ChatInterface />
      </div>
    </main>
  );
}
