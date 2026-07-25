"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveModuleProgress } from "./actions";

/**
 * Fixed top reading bar + persists scroll % for the open module.
 * Saves to Supabase (throttled) when the user is signed in.
 */
export function ModuleScrollProgress({
  moduleId,
  phaseId,
  initialPct = 0,
  isAuthenticated,
}: {
  moduleId: string;
  phaseId: string;
  initialPct?: number;
  isAuthenticated: boolean;
}) {
  const [pct, setPct] = useState(Math.min(100, Math.max(0, initialPct)));
  const lastSaved = useRef(initialPct);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peak = useRef(initialPct);

  const persist = useCallback(
    (value: number) => {
      if (!isAuthenticated) return;
      // Only move progress forward
      if (value < lastSaved.current && value < 95) return;
      if (Math.abs(value - lastSaved.current) < 3 && value < 95) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        lastSaved.current = value;
        void saveModuleProgress({ moduleId, phaseId, progressPct: value });
      }, 800);
    },
    [isAuthenticated, moduleId, phaseId]
  );

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - window.innerHeight;
      const next = max <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / max) * 100));
      if (next > peak.current) peak.current = next;
      const display = Math.max(peak.current, next);
      setPct(display);
      persist(display);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Final save on unmount
      if (isAuthenticated && peak.current > lastSaved.current) {
        void saveModuleProgress({
          moduleId,
          phaseId,
          progressPct: peak.current,
        });
      }
    };
  }, [moduleId, phaseId, isAuthenticated, persist]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70]">
      <div className="h-1 w-full bg-slate-200/60 dark:bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-brand-500 via-cyan-400 to-violet-500 shadow-[0_0_12px_rgba(99,102,241,0.55)] transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="pointer-events-auto absolute right-3 top-2 hidden sm:block">
        <span className="rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
          {pct}% read
        </span>
      </div>
    </div>
  );
}
