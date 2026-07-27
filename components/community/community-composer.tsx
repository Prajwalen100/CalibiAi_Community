"use client";

import Link from "next/link";
import { Code2, Image as ImageIcon, Github, PenLine } from "lucide-react";

export function CommunityComposer({ username }: { username: string }) {
  return (
    <div className="glass-panel-subtle rounded-2xl p-3 transition-all duration-300 hover:border-brand-500/40">
      <Link
        href="/community/create"
        className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-400 transition hover:border-brand-300 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:text-slate-200"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
          {username.charAt(0).toUpperCase() || "?"}
        </span>
        <span className="flex-1">Share your AI workflow…</span>
        <PenLine className="h-4 w-4 text-slate-300" />
      </Link>

      <div className="mt-2 flex items-center gap-2 px-1">
        <Link
          href="/community/create?type=tutorial"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/70 px-2.5 py-1 text-xs font-semibold text-secondary transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:hover:text-brand-300"
        >
          <Code2 className="h-3.5 w-3.5" /> Code
        </Link>
        <Link
          href="/community/create?type=showcase"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/70 px-2.5 py-1 text-xs font-semibold text-secondary transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:hover:text-brand-300"
        >
          <ImageIcon className="h-3.5 w-3.5" /> Image
        </Link>
        <Link
          href="/community/create?type=showcase"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/70 px-2.5 py-1 text-xs font-semibold text-secondary transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:hover:text-brand-300"
        >
          <Github className="h-3.5 w-3.5" /> GitHub
        </Link>
      </div>
    </div>
  );
}
