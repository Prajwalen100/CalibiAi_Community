"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Fixed "line" progress bar pinned to the top of the viewport while reading
 * an article. It tracks how far the reader has scrolled through the page
 * and — because `max` collapses to the true bottom of the document — always
 * lands on exactly 100% once the reader hits the bottom, regardless of how
 * tall the article ends up being (long markdown bodies, embedded diagrams,
 * resource cards, etc. can all grow the page after first paint).
 */
export function ArticleScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const computeProgress = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - window.innerHeight;
      const pct = max <= 0 ? 100 : Math.round((window.scrollY / max) * 100);
      setProgress(Math.min(100, Math.max(0, pct)));
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(computeProgress);
    };

    // The article body can grow after the initial paint (images, mermaid
    // diagrams, lazily measured markdown blocks), which would otherwise
    // leave the bar stuck short of 100% even once the reader is at the
    // true bottom of the page. Re-measuring on resize keeps it honest.
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(document.body);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    computeProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const isComplete = progress >= 100;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-1.5 bg-slate-200/70 dark:bg-slate-800/70"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Article reading progress"
    >
      <div
        className={`h-full bg-gradient-to-r transition-all duration-150 ease-out ${
          isComplete
            ? "from-emerald-500 via-emerald-500 to-teal-400"
            : "from-brand-500 via-violet-500 to-cyan-500"
        }`}
        style={{ width: `${progress}%` }}
      />
      <div
        className={`pointer-events-none absolute right-4 top-3 hidden items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur transition-colors duration-300 sm:flex ${
          isComplete
            ? "bg-emerald-600 text-white"
            : "bg-white/90 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300"
        }`}
      >
        {isComplete ? (
          <>
            <CheckCircle2 className="h-3 w-3" /> 100% Complete
          </>
        ) : (
          `${progress}%`
        )}
      </div>
    </div>
  );
}
