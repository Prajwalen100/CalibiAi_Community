"use client";

import { useEffect, useState } from "react";

export function ArticleScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - window.innerHeight;
      const pct = max <= 0 ? 100 : Math.round((window.scrollY / max) * 100);
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-slate-200/70">
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-violet-500 to-cyan-500 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
      <div className="pointer-events-none absolute right-4 top-3 hidden rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur sm:block">
        {progress}%
      </div>
    </div>
  );
}
