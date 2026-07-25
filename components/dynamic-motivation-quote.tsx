"use client";
import { useState, useEffect, useCallback } from "react";
import { Quote, RefreshCw } from "lucide-react";

const FALLBACK_QUOTES = [
  "Every expert was once a beginner. — Helen Hayes",
  "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "The best way to predict the future is to create it. — Peter Drucker",
  "Code is like humor. When you have to explain it, it's bad. — Cory House",
  "The only way to learn is to build, fail, and iterate.",
  "Your journey of a thousand models begins with a single dataset.",
  "Practice isn't the thing you do once you're good. It's the thing you do that makes you good. — Malcolm Gladwell",
];

export function DynamicMotivationQuote({ userName: propName }: { userName?: string }) {
  const [quote, setQuote] = useState<string>("Loading your motivation...");
  const [loading, setLoading] = useState(false);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
      // Always try the server-side AI endpoint first (it handles its own configuration)
      const res = await fetch("/api/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write one short, inspirational daily motivation quote for an AI engineering student named ${propName || "Student"}. Make it specific to learning code, building AI systems, and personal growth. Keep it under 120 characters.`
        }),
      });
      const data = await res.json();
      if (data?.text) {
        setQuote(data.text.slice(0, 200));
        setLoading(false);
        return;
      }
      // Fallback to curated list with dynamic rotation based on day
      const day = new Date().getDate();
      const index = (day + (propName?.length ?? 0)) % FALLBACK_QUOTES.length;
      setQuote(FALLBACK_QUOTES[index]);
    } catch {
      const index = Math.floor(Math.random() * FALLBACK_QUOTES.length);
      setQuote(FALLBACK_QUOTES[index]);
    } finally {
      setLoading(false);
    }
  }, [propName]);

  useEffect(() => {
    // Intentionally fetching data for this component; suppress false-positive lint error
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuote();
  }, [fetchQuote]);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-brand-600 p-5 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />
      <div className="relative flex items-start gap-3">
        <Quote className="h-6 w-6 shrink-0 text-violet-200 mt-0.5" />
        <div>
          <p className="text-sm font-medium leading-relaxed text-white/90">{quote}</p>
          <button
            onClick={fetchQuote}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25 transition backdrop-blur-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> New Quote
          </button>
        </div>
      </div>
    </div>
  );
}
