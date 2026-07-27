"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X, FolderGit2, Radar, Users, ListChecks, Award, BookOpenText, ClipboardCheck } from "lucide-react";
import { SCORE_WEIGHTS, TIERS } from "@/lib/score/config";

type Breakdown = {
  projects: number;
  skills: number;
  community: number;
  completion: number;
  recognition: number;
  reading: number;
  quizzes: number;
};

type Props = {
  breakdown: Breakdown;
  total: number;
  tier: string;
};

const PILLARS: Array<{
  key: keyof Breakdown;
  label: string;
  icon: typeof FolderGit2;
  color: string;
  how: string;
}> = [
  {
    key: "projects",
    label: "Verified Projects",
    icon: FolderGit2,
    color: "text-brand-600 dark:text-brand-300",
    how: "Each project you submit is reviewed by CalibiAI Assistant on a 0-100 scale for completeness, technical depth, originality and verifiability (repo/live links). Points awarded = review score × 4, but only projects that pass review (score ≥ 50, not flagged for likely-copied or AI-generated-without-input work) count. Points from all your verified projects are summed, then capped at this pillar's maximum.",
  },
  {
    key: "skills",
    label: "Verified Skills",
    icon: Radar,
    color: "text-violet-600 dark:text-violet-300",
    how: "Each skill that gets verified (through assessments or reviewed submissions) is worth 25 points, summed across all your verified skills and capped at this pillar's maximum.",
  },
  {
    key: "completion",
    label: "Roadmap Completion",
    icon: ListChecks,
    color: "text-emerald-600 dark:text-emerald-300",
    how: "The share of your assigned roadmap modules marked completed (completed modules ÷ total assigned modules), scaled to this pillar's maximum. Passing AI Lab mini-project submissions also lock in completion points here and are never reduced by a later recalculation — only increased.",
  },
  {
    key: "community",
    label: "Community Activity",
    icon: Users,
    color: "text-cyan-600 dark:text-cyan-300",
    how: "Driven by your Community XP (earned from posts, comments, accepted answers, upvotes received, etc.). Raw XP is capped at this pillar's maximum, then reduced if you've been inactive: full value within 14 days of your last community action, 80% within 30 days, 55% within 60 days, and 30% beyond that (or 60% by default if no activity is on record yet) — so the number reflects current engagement, not just historical totals.",
  },
  {
    key: "recognition",
    label: "Recognition",
    icon: Award,
    color: "text-amber-600 dark:text-amber-300",
    how: "Bonus points from platform recognition — things like featured posts, badges, and mentor/staff shout-outs — capped at this pillar's maximum.",
  },
  {
    key: "reading",
    label: "Learning Engagement",
    icon: BookOpenText,
    color: "text-sky-600 dark:text-sky-300",
    how: "Based on your article/reading engagement percentage (0-100%) across the Learning Hub, scaled to this pillar's maximum.",
  },
  {
    key: "quizzes",
    label: "Quiz Performance",
    icon: ClipboardCheck,
    color: "text-fuchsia-600 dark:text-fuchsia-300",
    how: "Based on your average roadmap quiz score (0-100%), scaled to this pillar's maximum.",
  },
];

/**
 * "Why?" button next to the Talent Score bar. Opens a popup that explains
 * the full scoring methodology — every pillar's weight, how it's computed,
 * and this profile's live breakdown across each pillar.
 */
export function WhyScoreButton({ breakdown, total, tier }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-white/70 transition hover:border-white/30 hover:bg-white/15 hover:text-white"
      >
        <HelpCircle className="h-3 w-3" /> Why?
      </button>

      {open && typeof document !== "undefined" && createPortal(
        // This profile page is animated with transformed containers. Portaling
        // prevents those containers from clipping a viewport-fixed dialog.
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/60 px-4 py-8 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="How the Talent Score is calculated"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">How the Talent Score is calculated</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Out of {SCORE_WEIGHTS.projects + SCORE_WEIGHTS.skills + SCORE_WEIGHTS.community + SCORE_WEIGHTS.completion + SCORE_WEIGHTS.recognition + SCORE_WEIGHTS.reading + SCORE_WEIGHTS.quizzes} points across 7 weighted pillars.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-white/[0.03]">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  This profile currently scores <span className="font-black text-slate-950 dark:text-white">{total}</span> points,
                  placing it in the <span className="font-black capitalize text-slate-950 dark:text-white">{tier}</span> tier.
                  Tiers: {TIERS.map((t) => `${t.tier[0].toUpperCase()}${t.tier.slice(1)} (${t.min}-${t.max})`).join(", ")}.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  const earned = breakdown[pillar.key];
                  const max = SCORE_WEIGHTS[pillar.key];
                  const pct = max > 0 ? Math.round((earned / max) * 100) : 0;
                  return (
                    <div key={pillar.key} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`flex items-center gap-2 text-sm font-black ${pillar.color}`}>
                          <Icon className="h-4 w-4" /> {pillar.label}
                        </p>
                        <span className="font-mono text-sm font-black text-slate-950 dark:text-white">
                          {earned}/{max} pts
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{pillar.how}</p>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-400 dark:text-slate-500">
                Each pillar is calculated independently and capped at its own maximum, then all seven are summed and
                capped at 1000 total. Any project flagged as likely copied or AI-generated without personal input
                is excluded from the Verified Projects pillar until it's re-reviewed. Scores recalculate automatically
                after key activity and periodically when a profile is viewed, so this always reflects your latest work.
              </p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
