"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Terminal, Send, Cpu, User, Sparkles, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWindow({
  onTelemetryReceived,
}: {
  onTelemetryReceived: (telemetry: any) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am the AI Career Agent of the developer. Ask me about his tech stack, projects, or hireability!",
    },
  ]);
  const [input, setInput] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, audioLoading]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startAudioRecording = async () => {
    try {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }

      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await handleAudioUpload(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Microphone access is required for voice features.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setAudioLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Voice processing engine failed.");

      const data = await response.json();

      if (data.userText) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: data.userText },
        ]);
      }

      if (data.aiText) {
        startTransition(() => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.aiText },
          ]);
        });
        triggerTextToSpeech(data.aiText);
      }

      // 📊 voice api tememetry send
      if (data.telemetry && typeof onTelemetryReceived === "function") {
        onTelemetryReceived(data.telemetry);
      }
    } catch (error: any) {
      console.error("Audio API Failure:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Failed to interpret audio. Please type instead.",
        },
      ]);
    } finally {
      setAudioLoading(false);
    }
  };

  const triggerTextToSpeech = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const userMessage = input.trim();
    if (!userMessage || isLoading || isPending || audioLoading) return;

    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data && typeof data.response === "string") {
        startTransition(() => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.response },
          ]);
        });

        if (data.telemetry && typeof onTelemetryReceived === "function") {
          onTelemetryReceived(data.telemetry);
        }
      } else {
        throw new Error("Invalid response format.");
      }
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Failed to fetch AI response:", error);

      startTransition(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: error.message?.includes("429")
              ? "⚠️ Rate limit hit. Please retry shortly."
              : `❌ Error: ${error.message || "Failed to connect to server."}`,
          },
        ]);
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const isUiLoading = isLoading || isPending || audioLoading;

  return (
    
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[500px] border border-zinc-800/80 rounded-xl bg-zinc-950/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-blue-950/20">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-mono text-green-400 select-none">
            agent_terminal_query_monitor
          </span>
        </div>
        <div className="flex gap-1.5 select-none">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border select-none ${
                msg.role === "user"
                  ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                  : "bg-blue-950/40 border-blue-900/60 text-blue-400"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Cpu className="w-4 h-4" />
              )}
            </div>
            <div
              className={`rounded-xl p-3 leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none whitespace-pre-wrap"
                  : "bg-zinc-900/60 border border-zinc-800/40 text-zinc-300 rounded-tl-none"
              }`}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <div className="prose prose-invert prose-sm max-w-none break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors underline font-medium inline-flex items-center gap-0.5"
                        />
                      ),
                      table: ({ ...props }) => (
                        <div className="overflow-x-auto my-3 border border-zinc-800 rounded-lg shadow-sm">
                          <table
                            {...props}
                            className="min-w-full divide-y divide-zinc-800 text-xs text-zinc-300 font-sans"
                          />
                        </div>
                      ),
                      thead: ({ ...props }) => (
                        <thead {...props} className="bg-zinc-900/80" />
                      ),
                      th: ({ ...props }) => (
                        <th
                          {...props}
                          className="px-3 py-2 text-zinc-400 font-semibold text-left border-b border-zinc-800"
                        />
                      ),
                      td: ({ ...props }) => (
                        <td
                          {...props}
                          className="px-3 py-2 border-b border-zinc-800/50"
                        />
                      ),
                      img: ({ ...props }) => (
                        <img
                          {...props}
                          className="rounded-lg max-w-full h-auto my-3 border border-zinc-800 shadow-lg object-cover max-h-48"
                          loading="lazy"
                        />
                      ),
                      ul: ({ ...props }) => (
                        <ul
                          {...props}
                          className="list-disc pl-5 my-2 space-y-1 text-zinc-300"
                        />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          {...props}
                          className="list-decimal pl-5 my-2 space-y-1 text-zinc-300"
                        />
                      ),
                      h3: ({ ...props }) => (
                        <h3
                          {...props}
                          className="text-sm font-bold mt-3 mb-1 text-white border-b border-zinc-800 pb-1"
                        />
                      ),
                      strong: ({ ...props }) => (
                        <strong
                          {...props}
                          className="font-semibold text-blue-400"
                        />
                      ),
                      p: ({ ...props }) => (
                        <p {...props} className="mb-2 last:mb-0" />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {msg.content?.toLowerCase().includes("resume") && (
                    <div className="mt-3 p-3 border border-blue-500/20 bg-blue-950/10 rounded-xl flex items-center justify-between backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">
                            Muhammad_Resume.pdf
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Official PDF with Profile Image
                          </p>
                        </div>
                      </div>
                      <a
                        href="https://drive.google.com/file/d/1kmaNcnpcjOcLjp4s-hcpMNUDBG_P75_d/view?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-zinc-950 font-bold text-xs rounded-lg shadow-md hover:shadow-blue-500/20 transition-all duration-200 flex items-center gap-1"
                      >
                        View PDF
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isUiLoading && (
          <div className="flex gap-3 mr-auto max-w-[85%] items-center select-none">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400 flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/40 text-zinc-500 rounded-xl rounded-tl-none p-3 text-xs font-mono animate-pulse">
              {audioLoading
                ? "Groq Whisper is processing your voice audio..."
                : "AI Engine is thinking & analyzing tools..."}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Action Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-zinc-900/20 border-t border-zinc-800/60 flex gap-2 items-center"
      >
        <button
          type="button"
          onClick={isRecording ? stopAudioRecording : startAudioRecording}
          disabled={isLoading || isPending || audioLoading}
          className={`p-2.5 rounded-full transition-all flex items-center justify-center border disabled:opacity-40 disabled:cursor-not-allowed ${
            isRecording
              ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse scale-105"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
          title={isRecording ? "Stop Recording" : "Record Voice Message"}
        >
          {isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isRecording ? "Listening to your voice..." : "Ask query about me..."
          }
          disabled={isUiLoading || isRecording}
          className="flex-1 bg-zinc-950/60 text-zinc-200 text-sm rounded-full px-3.5 py-2 border border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
        />

        <button
          type="submit"
          disabled={isUiLoading || !input.trim() || isRecording}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center disabled:text-zinc-500 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
