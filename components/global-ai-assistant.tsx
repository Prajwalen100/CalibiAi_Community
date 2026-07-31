"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Plus,
  History,
  Send,
  Code2,
  Image as ImageIcon,
  Github,
  Bot,
} from "lucide-react";
import { AiMarkdown } from "@/components/ai/ai-markdown";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string };

type MockThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

const SUGGESTED_PROMPTS = [
  "Design an intense 30-day AI upskilling plan.",
  "How do I structure my resume for an applied AI role?",
  "Explain the core theory behind RAG pipelines.",
  "What should I build to prove real ML engineering skill?",
];

const MOCK_HISTORY: MockThread[] = [
  {
    id: "h1",
    title: "30-Day Technical Preparation Timeline",
    messages: [
      {
        id: "h1-u",
        role: "user",
        content: "Design an intense 30-day AI upskilling plan for a final-year engineer.",
      },
      {
        id: "h1-a",
        role: "assistant",
        content:
          "## 30-Day Applied-AI Sprint\n\n**Weeks 1–2 — Foundations**\n- Python + vector math refresher\n- Build 3 small RAG apps (LangChain + FAISS)\n\n**Weeks 3–4 — Systems**\n- Fine-tune a small LLM on a toy dataset\n- Ship one end-to-end pipeline with eval metrics\n\n> Track everything in a public repo — proof beats certificates.",
      },
    ],
  },
  {
    id: "h2",
    title: "AWS AI/ML Certification Guide",
    messages: [
      {
        id: "h2-u",
        role: "user",
        content: "Which AWS cert should an applied-AI engineer target first?",
      },
      {
        id: "h2-a",
        role: "assistant",
        content:
          "Start with **AWS Certified Machine Learning – Specialty**. Pair it with:\n- SageMaker for training/deploy\n- Bedrock for managed foundation models\n\nIt maps cleanly to the build → evaluate → ship loop interviewers ask about.",
      },
    ],
  },
  {
    id: "h3",
    title: "Debugging Data Extraction Scripts",
    messages: [
      {
        id: "h3-u",
        role: "user",
        content: "My data extraction script drops rows with emoji. Why?",
      },
      {
        id: "h3-a",
        role: "assistant",
        content:
          "Likely an encoding mismatch. Ensure:\n```python\nopen(path, encoding=\"utf-8\")\n```\nand validate the parser handles 4-byte code points before writing to CSV.",
      },
    ],
  },
  {
    id: "h4",
    title: "Deepseek vs. Llama 3 Architecture",
    messages: [
      {
        id: "h4-u",
        role: "user",
        content: "Compare Deepseek and Llama 3 architectures for a RAG assistant.",
      },
      {
        id: "h4-a",
        role: "assistant",
        content:
          "Both are decoder-only transformers. The practical difference is **cost + latency**: Deepseek-chat is cheaper for high-volume RAG, while Llama 3 self-hosted gives you data residency. Pick on compliance, not hype.",
      },
    ],
  },
];

const STORAGE_KEY = "calibiai-chat-thread";

function uid() {
  return Math.random().toString(36).slice(2);
}

export function GlobalAiAssistant() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  // Start with the exact state the server rendered. The saved thread is
  // restored in an effect after hydration: reading localStorage during the
  // initial render makes the first client render differ from the SSR markup,
  // which breaks React hydration for the whole page (root-layout boundary).
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasRestored, setHasRestored] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore the previous conversation only after the component has mounted,
  // so the first client render matches the server-rendered HTML exactly.
  // The synchronous setState is deliberate: this effect exists precisely to
  // swap in the client-only thread once hydration is done.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* corrupted or unavailable storage — start fresh */
    }
    setHasRestored(true);
  }, []);

  useEffect(() => {
    // Never persist before the restore effect above has run: on mount the
    // state is briefly the empty array and would wipe the saved thread.
    if (!hasRestored) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, hasRestored]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, view]);

  // Hide on admin / employer / auth / api surfaces (after all hooks fire).
  const hidden =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/employer") ||
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/api");
  if (hidden) return null;

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function newChat() {
    setMessages([]);
    setError(null);
    setView("chat");
  }

  function loadThread(thread: MockThread) {
    setMessages(thread.messages);
    setView("chat");
    setError(null);
  }

  async function send(text?: string) {
    const prompt = (text ?? input).trim();
    if (!prompt || loading) return;
    setError(null);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg: ChatMessage = { id: uid(), role: "user", content: prompt };
    const assistantMsg: ChatMessage = { id: uid(), role: "assistant", content: "" };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.status === 401) {
        setError("Please sign in to use the Calibi AI Assistant.");
        setMessages((m) => m.filter((msg) => msg.id !== assistantMsg.id));
        return;
      }
      if (!res.ok) {
        setError("The assistant hit an error. Please try again.");
        setMessages((m) => m.filter((msg) => msg.id !== assistantMsg.id));
        return;
      }
      const data = (await res.json()) as { answer?: string };
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantMsg.id
            ? { ...msg, content: data.answer ?? "_No response._" }
            : msg,
        ),
      );
    } catch {
      setError("Network error — please check your connection and retry.");
      setMessages((m) => m.filter((msg) => msg.id !== assistantMsg.id));
    } finally {
      setLoading(false);
    }
  }

  const showEmpty = messages.length === 0 && !loading;

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        aria-label="Open Calibi AI Assistant"
        onClick={() => setOpen((o) => !o)}
        // `global-ai-fab` lets globals.css lift the button above the mobile
        // bottom tab bar (and the home indicator) when that bar is mounted.
        className="global-ai-fab group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-transform duration-300 hover:scale-105 active:scale-95"
        style={{
          background:
            "linear-gradient(135deg, rgba(31,143,255,0.9), rgba(124,58,237,0.9))",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow:
            "0 10px 40px rgba(31,143,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.15)",
        }}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/30" />
        <Sparkles className="relative h-6 w-6" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <aside
        // Safe-area padding keeps the panel clear of the notch and the home
        // indicator when the app is launched standalone on iOS.
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-slate-200/80 bg-white/95 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-slate-900 transition-transform duration-300 ease-out dark:border-slate-800/80 dark:bg-slate-950/95 dark:text-slate-100 shadow-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, rgba(31,143,255,0.9), rgba(124,58,237,0.9))" }}
            >
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-primary dark:text-white">Calibi AI Assistant</p>
              <p className="text-[10px] text-slate-500 dark:text-white/50">Powered by Deepseek</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Chat history"
              onClick={() => setView((v) => (v === "history" ? "chat" : "history"))}
              className={`rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-white/70 transition dark:hover:bg-white/10 dark:hover:text-white ${
                view === "history" ? "bg-slate-100 text-primary dark:bg-white/10 dark:text-white" : ""
              }`}
            >
              <History className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="New chat"
              onClick={newChat}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-white/70 transition dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-white/70 transition dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {view === "history" ? (
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/40">
              Saved conversations
            </p>
            {MOCK_HISTORY.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => loadThread(t)}
                className="block w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3 text-left transition hover:border-brand-400/50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-primary dark:text-white">
                  <History className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" />
                  {t.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-white/50">
                  {t.messages[0]?.content?.slice(0, 90)}…
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {showEmpty && (
              <div className="mt-2">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-white/5 p-3">
                  <Sparkles className="h-4 w-4 text-brand-500 dark:text-brand-300" />
                  <p className="text-sm text-slate-800 dark:text-white/80">
                    Hi, I&apos;m Calibi AI. Ask me anything about AI engineering, careers, or your build.
                  </p>
                </div>
                <p className="mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/40">
                  Try a prompt
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="rounded-full border border-slate-200/80 bg-slate-50/50 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition hover:border-brand-400/60"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2.5 text-sm text-white shadow-lg">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-slate-200/60 bg-slate-50/50 dark:border-white/10 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white/90 shadow-lg">
                    {m.content ? (
                      <AiMarkdown content={m.content} />
                    ) : (
                      <span className="inline-flex items-center gap-2 text-slate-500 dark:text-white/50">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 dark:bg-brand-300 [animation-delay:-0.2s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 dark:bg-brand-300 [animation-delay:-0.1s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 dark:bg-brand-300" />
                      </span>
                    )}
                  </div>
                </div>
              ),
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Input (only in chat view) */}
        {view === "chat" && (
          <div className="border-t border-slate-200/80 dark:border-white/10 p-3">
            <div
              className="flex items-end gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-white/5 p-2 transition focus-within:border-brand-400/60"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoGrow();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask anything about AI engineering…"
                className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-primary dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none"
              />
              <button
                type="button"
                aria-label="Send"
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                  input.trim() && !loading
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/40"
                    : "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-white/40"
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3 px-1 text-[10px] text-slate-400 dark:text-white/40">
              <span className="inline-flex items-center gap-1">
                <Code2 className="h-3 w-3" /> Code
              </span>
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Images
              </span>
              <span className="inline-flex items-center gap-1">
                <Github className="h-3 w-3" /> GitHub
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
