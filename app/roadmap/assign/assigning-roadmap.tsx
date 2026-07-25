"use client";

import { Loader2, RefreshCw, Route } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function AssigningRoadmap() {
  const started = useRef(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const assign = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/roadmap/assign", { method: "POST" });
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? "We couldn't assign your roadmap.");
      }
      window.location.replace("/dashboard?onboarding=complete");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't assign your roadmap.");
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void assign();
  }, [assign]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-indigo-50 px-4 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
          {busy ? <Loader2 className="h-8 w-8 animate-spin" /> : <Route className="h-8 w-8" />}
        </div>
        <p className="mt-6 text-sm font-bold text-brand-600">Assessment complete</p>
        <h1 className="mt-2 text-3xl font-black text-primary">
          {busy ? "Building your 45-day roadmap…" : "Your roadmap needs one more try"}
        </h1>
        <p className="mt-3 text-secondary">
          {busy
            ? "We're selecting the right level and preparing your first learning day."
            : error}
        </p>
        {error && !busy ? (
          <button type="button" className="btn-primary mt-6" onClick={() => void assign()}>
            <RefreshCw className="h-4 w-4" /> Retry assignment
          </button>
        ) : (
          <div className="mx-auto mt-7 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-brand-500 to-indigo-500" />
          </div>
        )}
      </section>
    </main>
  );
}
