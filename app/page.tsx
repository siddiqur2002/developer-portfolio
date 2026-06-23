"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import ChatWindow from "@/components/agent-ui/chat-window";
import { Cpu, Layers, Move, MoreVertical, X, Clock, Coins, Activity, Server } from "lucide-react";

// ৩টি মডেল ডিস্ট্রিবিউশন ট্র্যাক সহ ডিফল্ট স্টার্টিং ডেটা
const initialTelemetryHistory = [
  {
    id: "tr-sync",
    timestamp: "LIVE",
    totalLatency: 0.00,
    totalTokens: 0,
    totalCost: 0.00000,
    steps: [
      { node: "Workflow Decision", model: "llama-3.1-8b-instant" },
      { node: "Tool Invocation (Git/Mongo)", model: "llama-3.3-70b-versatile" },
      { node: "Deep Reasoning & Response Synthesis", model: "gpt-oss-120b" }
    ],
    modelsBreakdown: {
      "llama-3.1-8b-instant": { latency: 0.00, tokens: 0, cost: 0.00000, called: false },
      "llama-3.3-70b-versatile": { latency: 0.00, tokens: 0, cost: 0.00000, called: false },
      "gpt-oss-120b": { latency: 0.00, tokens: 0, cost: 0.00000, called: false }
    }
  }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false); // ড্যাশবোর্ড মোডাল স্টেট
  
  // 📊 লাইভ টেলিমেট্রি স্টেটসমূহ
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>(initialTelemetryHistory);
  const [selectedTrace, setSelectedTrace] = useState<any>(initialTelemetryHistory[0]);

  const [position, setPosition] = useState({ x: 50, y: 68 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkScreenSize = () => setIsDesktop(window.innerWidth > 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("input, button, a") || !isDesktop) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: (position.x / 100) * window.innerWidth,
      posY: (position.y / 100) * window.innerHeight,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      let newX = dragRef.current.posX + deltaX;
      let newY = dragRef.current.posY + deltaY;
      newX = Math.max(20, Math.min(window.innerWidth - 20, newX));
      newY = Math.max(20, Math.min(window.innerHeight - 20, newY));
      setPosition({ x: (newX / window.innerWidth) * 100, y: (newY / window.innerHeight) * 100 });
    };
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", () => setIsDragging(false));
    }
    return () => { window.removeEventListener("mousemove", handleMouseMove); };
  }, [isDragging]);

  // 🎯 চ্যাট উইন্ডো থেকে লাইভ টেলিমেট্রি ক্যাচ করার মেথড
  const handleNewTelemetry = (newTrace: any) => {
    setTelemetryHistory((prev) => [newTrace, ...prev]);
    setSelectedTrace(newTrace); // নতুন রেসপন্স আসার সাথে সাথে স্ক্রিনে ওটা এক্টিভ হবে
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-start p-4 relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* 🌐 Top Navigation Bar */}
      <nav className="z-40 w-full max-w-6xl flex items-center justify-between py-4 border-b border-zinc-900/80 mb-6 md:mb-8 backdrop-blur-md">
        <div className="relative" ref={dropdownRef}>
          <div className="hidden md:flex items-center gap-5 text-xs font-mono tracking-wider">
            <a href="https://github.com/siddiqur2002" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5">GITHUB</a>
            <span className="text-zinc-800 select-none">/</span>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-400 pb-0.5">LINKEDIN</a>
          </div>

          <button onClick={() => setShowDropdown(!showDropdown)} className="block md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800/80 transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>

          {showDropdown && (
            <div className="absolute left-0 mt-2 w-40 rounded-xl bg-zinc-950/90 border border-zinc-800/80 p-1.5 shadow-xl backdrop-blur-xl z-50 md:hidden">
              <a href="https://github.com/siddiqur2002" target="_blank" rel="noopener noreferrer" onClick={() => setShowDropdown(false)} className="block px-3 py-2 text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-lg transition-colors">GITHUB</a>
              <div className="h-px bg-zinc-900/80 my-1" />
              <a href="https://www.linkedin.com/in/md-siddiqur-rahman-a217b13ab/" target="_blank" rel="noopener noreferrer" onClick={() => setShowDropdown(false)} className="block px-3 py-2 text-xs font-mono text-zinc-400 hover:text-blue-400 hover:bg-zinc-900/50 rounded-lg transition-colors">LINKEDIN</a>
            </div>
          )}
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setShowDashboard(true)}
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-all bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/30 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Agent Pipeline Monitor</span>
          </button>
        </div>
      </nav>

      {/* 🚀 Main Hero Header Section */}
      <div className="z-10 w-full max-w-4xl text-center space-y-4 lg:space-y-3 pointer-events-none select-none pt-0 md:pt-6 lg:pt-10 md:-mt-6 lg:-mt-10 mb-12 md:mb-0">
        <div className="flex items-center justify-center gap-3 text-sm font-mono text-blue-400 bg-blue-950/20 border border-blue-900/50 px-4 py-1.5 rounded-full w-fit mx-auto shadow-sm backdrop-blur-sm">
          <Cpu className="w-4 h-4 animate-spin [animation-duration:3s]" />
          <span>AI Agentic-Augmented Developer Portfolio</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight bg-linear-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Md Siddiqur Rahman — Web Dev × AI Engineer
          </h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto font-light leading-relaxed">
            Building intelligent web applications with a focus on AI engineering, real-time LLM reasoning, and scalable full-stack web development.
          </p>
        </div>
      </div>

      {/* 💬 Floating Drag and Drop Chatbot Container */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: mounted && isDesktop ? "absolute" : "relative",
          left: mounted && isDesktop ? `${position.x}%` : "auto",
          top: mounted ? (isDesktop ? `${position.y}%` : "auto") : "auto",
          transform: mounted && isDesktop ? "translate(-50%, -50%)" : "none",
        }}
        className={`z-30 w-full max-w-2xl mt-4 md:mt-0 ${isDesktop ? (isDragging ? "cursor-grabbing shadow-blue-500/20" : "cursor-grab") : ""} transition-shadow duration-200`}
      >
        {mounted && isDesktop && (
          <div className="hidden md:flex items-center justify-center gap-1 text-[10px] text-zinc-600 font-mono mb-1 pointer-events-none select-none">
            <Move className="w-3 h-3" />
            <span>Hold anywhere on terminal header to drag window</span>
          </div>
        )}
        
        {/* 🎯 চ্যাট উইন্ডোতে লাইভ মেথডটি প্রপ্স আকারে পাস করে দেওয়া হলো */}
        <ChatWindow onTelemetryReceived={handleNewTelemetry} />
      </div>

      {/* 📊 LangSmith Multi-Model Live Dashboard Modal (আগের ডার্ক সাইবারপাঙ্ক পপ-আপ) */}
      {showDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-5xl bg-zinc-900/95 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden h-[90vh] md:h-auto max-h-[85vh] flex flex-col font-sans">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-semibold text-zinc-300">MULTI_MODEL_TELEMETRY // LIVE_STREAM</span>
              </div>
              <button onClick={() => setShowDashboard(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Analytic Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500">TOTAL AGENT LATENCY</p>
                    <p className="text-base font-bold text-zinc-200">{selectedTrace?.totalLatency || 0}s</p>
                  </div>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-xl flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500">ACCUMULATED TOKENS</p>
                    <p className="text-base font-bold text-zinc-200">{selectedTrace?.totalTokens || 0} tns</p>
                  </div>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-800/80 p-3 rounded-xl flex items-center gap-3">
                  <Coins className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500">ESTIMATED RUN OVERHEAD</p>
                    <p className="text-base font-bold text-emerald-400">${selectedTrace?.totalCost ? Number(selectedTrace.totalCost).toFixed(5) : "0.00000"}</p>
                  </div>
                </div>
              </div>

              {/* Main Content Split Block */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left Stream List */}
                <div className="lg:col-span-4 space-y-2">
                  <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Execution Graph Logs</p>
                  <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
                    {telemetryHistory.map((trace, idx) => (
                      <div
                        key={trace.id || idx}
                        onClick={() => setSelectedTrace(trace)}
                        className={`p-3 border rounded-xl cursor-pointer transition-all min-w-[220px] lg:min-w-0 flex-shrink-0 ${selectedTrace?.id === trace.id ? "bg-zinc-800/80 border-emerald-500/50" : "bg-zinc-950/20 border-zinc-800/60"}`}
                      >
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-mono text-emerald-400 font-bold">{trace.id}</span>
                          <span className="text-[10px] text-zinc-500">{trace.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono">Cost: ${trace.totalCost ? Number(trace.totalCost).toFixed(5) : "0.00000"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Breakdown Panel */}
                <div className="lg:col-span-8 bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-mono text-zinc-300 border-b border-zinc-800 pb-2 uppercase tracking-wide">Granular Model Layer Decomposition</p>
                  
                  {selectedTrace && selectedTrace.modelsBreakdown ? (
                    Object.entries(selectedTrace.modelsBreakdown).map(([modelName, data]: [string, any]) => (
                      <div key={modelName} className={`p-3 rounded-lg border ${data.called ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-950/10 border-zinc-900/50 opacity-40"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${data.called ? "bg-green-500 animate-pulse" : "bg-zinc-700"}`} />
                            <span className="font-mono text-xs font-bold text-zinc-200">{modelName}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {modelName.includes("instant") ? "Layer 1: Route & Decision" : modelName.includes("versatile") ? "Layer 2: Tool Calling" : "Layer 3: Synthesized Reasoning"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                          <div className="bg-zinc-950/60 p-1.5 rounded border border-zinc-800/40">
                            <p className="text-[9px] text-zinc-500">Latency</p>
                            <p className="text-zinc-300 font-bold">{data.latency}s</p>
                          </div>
                          <div className="bg-zinc-950/60 p-1.5 rounded border border-zinc-800/40">
                            <p className="text-[9px] text-zinc-500">Tokens</p>
                            <p className="text-zinc-300 font-bold">{data.tokens}t</p>
                          </div>
                          <div className="bg-zinc-950/60 p-1.5 rounded border border-zinc-800/40">
                            <p className="text-[9px] text-zinc-500">Cost</p>
                            <p className="text-emerald-500 font-bold">${data.cost ? Number(data.cost).toFixed(5) : "0.00000"}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 font-mono text-center py-6">No tracking layers active. Trigger a prompt to initialize mapping grids.</p>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}