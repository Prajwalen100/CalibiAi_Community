"use client";
import { useState } from "react";
import { Code2, Play, Upload, Save, Sparkles } from "lucide-react";
import Link from "next/link";

export function CodeEditor({
  defaultCode,
  taskType,
  dayNumber,
  taskTitle,
}: {
  defaultCode?: string;
  taskType: string;
  dayNumber: number;
  taskTitle: string;
}) {
  const [code, setCode] = useState(defaultCode || "# Start your practical task here\n# Explain your approach, add comments, and show results\nprint('Hello from Day " + String(dayNumber) + "!')");
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleRun() {
    setRunning(true);
    setTimeout(() => setRunning(false), 1500);
  }

  return (
    <div className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-950/30 dark:to-indigo-950/30 overflow-hidden shadow-xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-3 text-white">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          <span className="text-sm font-bold">Working Editor • Day {dayNumber}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRun} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25 transition backdrop-blur-sm flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5" /> Run
          </button>
          <button onClick={handleSave} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25 transition backdrop-blur-sm flex items-center gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-4">
        <textarea
          className="w-full h-72 bg-transparent text-green-300 font-mono text-sm leading-relaxed focus:outline-none resize-none p-2"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          style={{ caretColor: "#34d399" }}
        />
      </div>

      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500">
          {saved ? <span className="text-emerald-600 font-bold">✓ Saved locally</span> : <span>Type your solution, save when ready</span>}
        </div>
        <Link
          href={`/assessment/task?type=${taskType}&day=${dayNumber}&title=${encodeURIComponent(taskTitle)}`}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 transition shadow-lg shadow-brand-500/20"
        >
          <Sparkles className="h-4 w-4" /> Submit for AI Review
        </Link>
      </div>
    </div>
  );
}
