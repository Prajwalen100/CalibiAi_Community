"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PartyPopper, ArrowLeft, Sparkles } from "lucide-react";

interface ArticleCompletionBannerProps {
  /** Roadmap day this article belongs to — used for the "back" link and the
   * read-tracking beacon payload. */
  day: number;
}

/**
 * Sits at the very bottom of the article page. Once the reader scrolls all
 * the way down (the same moment the top progress bar hits 100%), an
 * `IntersectionObserver` on the sentinel below flips this into its
 * "completed" state:
 *
 *   - a celebratory card replaces the plain "keep reading" placeholder
 *   - the same read-tracking beacon used by the day page's
 *     "Read Detailed Article" link fires here too, so directly landing on
 *     the article (e.g. a bookmark) and reading it end-to-end still marks
 *     the day's article requirement satisfied without requiring a click
 *     back on the roadmap page first.
 */
export function ArticleCompletionBanner({ day }: ArticleCompletionBannerProps) {
  const [completed, setCompleted] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const markRead = () => {
      if (trackedRef.current) return;
      trackedRef.current = true;
      const payload = JSON.stringify({ day });
      try {
        const beacon = new Blob([payload], { type: "application/json" });
        const queued = navigator.sendBeacon?.("/api/roadmap/article-read", beacon);
        if (!queued) {
          void fetch("/api/roadmap/article-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => undefined);
        }
      } catch {
        // Beacon failures should never block the completion UI.
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setCompleted(true);
            markRead();
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [day]);

  return (
    <div className="mt-10">
      {/* Invisible tripwire — becomes visible exactly when the reader hits
          the true bottom of the page, mirroring the top scroll bar's 100%. */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      <div
        className={`flex flex-col items-center gap-4 rounded-2xl border p-6 text-center transition-all duration-500 sm:flex-row sm:justify-between sm:text-left ${
          completed
            ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/20"
            : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
              completed
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
            }`}
          >
            {completed ? <PartyPopper className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </span>
          <div>
            <p
              className={`text-lg font-black ${
                completed ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {completed ? "Article Completed! 🎉" : "Almost there…"}
            </p>
            <p className={`text-sm ${completed ? "text-emerald-700/80 dark:text-emerald-300/80" : "text-slate-400"}`}>
              {completed
                ? "You've read the full article — this counts toward today's requirements."
                : "Keep scrolling to the end to mark this article as read."}
            </p>
          </div>
        </div>

        <Link
          href={`/roadmap/day/${day}`}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-sm transition-all duration-300 ${
            completed
              ? "bg-emerald-600 text-white hover:-translate-y-0.5 hover:bg-emerald-700"
              : "border border-slate-200 bg-white text-slate-500 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Day {day}
        </Link>
      </div>
    </div>
  );
}
