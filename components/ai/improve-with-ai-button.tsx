"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";

type Props = {
  /** Current text in the field this button improves. */
  text: string;
  /** Called with the accepted, AI-improved text. */
  onApply: (improved: string) => void;
  /** Short label used in the AI prompt, e.g. "post" or "comment". */
  context?: string;
  className?: string;
};

/**
 * "Improve with AI" — sends the current draft to the writing-assistant
 * endpoint, then shows a side-by-side preview so the author can accept or
 * discard the suggestion instead of having their text silently rewritten.
 */
export function ImproveWithAiButton({ text, onApply, context = "text", className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  async function handleImprove() {
    if (!text.trim()) {
      setError("Write something first, then improve it with AI.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/ai/improve-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Could not improve the text right now.");
      } else {
        setSuggestion(data.improved);
      }
    } catch {
      setError("Network error while reaching the AI assistant.");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!suggestion) return;
    onApply(suggestion);
    setSuggestion(null);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleImprove}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? "Improving…" : "Improve with AI"}
      </button>

      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}

      {suggestion && (
        <div className="mt-2 rounded-xl border border-purple-200 bg-purple-50/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
            <Sparkles className="h-3.5 w-3.5" /> AI suggestion
          </p>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-slate-700">{suggestion}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
            >
              <Check className="h-3.5 w-3.5" /> Use this
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
