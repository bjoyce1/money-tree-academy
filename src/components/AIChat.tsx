import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/state/store";
import { Send, Bot, User, Sparkles, BookOpen, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { scoreResponse } from "@/services/harnessService";

type Msg = { role: "user" | "assistant"; content: string; scored?: boolean };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface AIChartProps {
  chapterContext?: { id: string; title: string; order: number; summary?: string };
}

export default function AIChat({ chapterContext }: AIChartProps = {}) {
  const guide = useAppStore((s) => s.progress.selectedGuide);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: guide
      ? `Hi! I'm ${guide.charAt(0).toUpperCase() + guide.slice(1)}, your Money Tree companion. Ask me anything about this chapter or financial literacy!`
      : "Hi! I'm your Money Tree companion. Ask me anything about saving, budgeting, earning, or investing!" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleScore = async (idx: number, positive: boolean) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, scored: true } : m));
    try { await scoreResponse(positive, "chat"); } catch {}
  };

  const streamResponse = async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        characterId: guide,
        chapterContext: chapterContext || null,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Something went wrong" }));
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${err.error || "Something went wrong. Try again!"}` }]);
      return;
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, idx);
        textBuffer = textBuffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") return;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            const text = assistantSoFar;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: text } : m));
              }
              return [...prev, { role: "assistant", content: text }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setInput("");
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setIsLoading(true);

    try {
      await streamResponse(allMsgs);
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Oops! Something went wrong. Please try again." }]);
    }
    setIsLoading(false);
  };

  const quickAction = async (prompt: string) => {
    if (isLoading) return;
    const userMsg: Msg = { role: "user", content: prompt };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setIsLoading(true);
    try {
      await streamResponse(allMsgs);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Something went wrong." }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[60vh] rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
        <Bot className="w-5 h-5 text-emerald-400" />
        <span className="font-semibold text-slate-100 text-sm">
          AI Learning Companion
          {guide && <span className="text-emerald-400 ml-1">• {guide.charAt(0).toUpperCase() + guide.slice(1)}</span>}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((m, i) => (
          <div key={i} className="group">
            <div className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
              m.role === "assistant" ? "bg-slate-800 text-slate-200" : "bg-emerald-600/20 text-slate-100"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
            )}
            </div>
            {m.role === "assistant" && i > 0 && !m.scored && (
              <div className="flex gap-1 mt-1 ml-9 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleScore(i, true)} className="text-xs text-slate-500 hover:text-emerald-400 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1">
                  <ThumbsUp size={10} /> Helpful
                </button>
                <button onClick={() => handleScore(i, false)} className="text-xs text-slate-500 hover:text-red-400 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1">
                  <ThumbsDown size={10} /> Not quite
                </button>
              </div>
            )}
            {m.role === "assistant" && m.scored && (
              <div className="text-xs text-slate-600 mt-1 ml-9">✓ Feedback recorded</div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="bg-slate-800 px-3 py-2 rounded-xl flex gap-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-slate-800">
        <button onClick={() => quickAction("Generate a quick money quiz for me!")}
          className="text-xs px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> Quiz
        </button>
        <button onClick={() => quickAction("Give me a real-world money scenario to practice with!")}
          className="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Scenario
        </button>
      </div>

      <div className="border-t border-slate-700 p-3 flex gap-2">
        <input aria-label="Ask a question"
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about money, saving, budgeting..." disabled={isLoading} />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()}
          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
