"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Bot,
  MessageSquareText,
} from "lucide-react";
import { AiMarkdown } from "@/components/ai/ai-markdown";
import { deleteAiQa, toggleSaveAiQa } from "@/app/community/actions";

export type AiQaItem = {
  id: string;
  question: string;
  answer: string;
  model: string | null;
  isSaved: boolean;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function AiQaList({ items }: { items: AiQaItem[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(items[0]?.id ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this saved AI question? This cannot be undone.")) return;
    setBusyId(id);
    setRemoving((prev) => new Set(prev).add(id));
    await deleteAiQa(id);
    router.refresh();
    setBusyId(null);
  }

  async function handleToggleSave(item: AiQaItem) {
    setBusyId(item.id);
    await toggleSaveAiQa(item.id, !item.isSaved);
    router.refresh();
    setBusyId(null);
  }

  if (items.length === 0) {
    return (
      <div className="glass-panel-subtle mt-6 flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/50">
          <Bot className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-primary">No saved AI questions yet</h3>
        <p className="max-w-sm text-sm text-secondary">
          Ask the CalibiAI Assistant a question and it will be saved here automatically so you can
          revisit the answers anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {items.map((item) => {
        const isOpen = expanded === item.id;
        const isRemoving = removing.has(item.id);
        return (
          <div
            key={item.id}
            className={`glass-panel-subtle overflow-hidden transition-all duration-300 ${
              isRemoving ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : item.id)}
              className="flex w-full items-start gap-3 px-5 py-4 text-left"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/50">
                <MessageSquareText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  {!item.isSaved && (
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Unsaved
                    </span>
                  )}
                  <span className="text-xs text-subtle">{timeAgo(item.createdAt)}</span>
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-primary">
                  {item.question}
                </span>
              </span>
              <ChevronDown
                className={`mt-1 h-5 w-5 shrink-0 text-subtle transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-slate-200/60 px-5 py-4 dark:border-slate-800/60">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-purple-900 dark:text-purple-200">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  CalibiAI Assistant Answer
                  {item.model && (
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {item.model}
                    </span>
                  )}
                </div>
                <article className="text-secondary">
                  <AiMarkdown content={item.answer} />
                </article>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-4 dark:border-slate-800/60">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleToggleSave(item)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${
                      item.isSaved
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {item.isSaved ? (
                      <BookmarkCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )}
                    {item.isSaved ? "Saved" : "Mark saved"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/50 dark:bg-slate-900 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
