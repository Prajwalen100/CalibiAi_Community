"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Trophy,
  CheckCircle2,
  Calendar,
  Sparkles,
  Code2,
  Wrench,
  MessageSquare,
  ChevronRight,
  BrainCircuit,
} from "lucide-react";

/**
 * A passed AI Lab mini-project submission.
 *
 * The dashboard previously rendered only `task_description` in a static,
 * unclickable card. This shape carries the same rich detail the public
 * profile already shows (AI feedback, strengths, improvements, the submitted
 * code) so the dashboard can surface a real project description too.
 */
export type LabProjectDetail = {
  id: string;
  day: number;
  task_description: string;
  submission_language: string;
  score: number;
  points_awarded: number;
  ai_enriched?: boolean | null;
  created_at?: string | null;
  level?: string | null;
  feedback?: string | null;
  submission?: string | null;
  explanation?: string | null;
  strengths?: unknown;
  improvements?: unknown;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return [value];
    }
  }
  return [];
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-300";
  if (score >= 70) return "text-amber-600 dark:text-amber-300";
  return "text-slate-600 dark:text-slate-300";
}

function MetaChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
      <span className="text-violet-600 dark:text-violet-300">{icon}</span>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      {value}
    </span>
  );
}

/* ── Detail popup ─────────────────────────────────────────────── */

export function LabProjectModal({
  project,
  open,
  onClose,
}: {
  project: LabProjectDetail;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const strengths = asStringArray(project.strengths);
  const improvements = asStringArray(project.improvements);
  const created = formatDate(project.created_at);

  if (typeof document === "undefined") return null;

  // Portalled for the same reason as the project modal: dashboard cards sit
  // inside transformed containers, which would otherwise clip a fixed overlay.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`AI Lab day ${project.day} details`}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="modal-glass relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-violet-700 to-fuchsia-700 p-5 text-white sm:p-6">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <button
                onClick={onClose}
                aria-label="Close project details"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative flex items-start gap-4 pr-10">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md sm:h-16 sm:w-16">
                  <BrainCircuit className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
                    AI Lab · Day {project.day}
                  </p>
                  <h2 className="mt-1 text-lg font-black leading-tight sm:text-xl">
                    {project.task_description}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-black text-emerald-100 ring-1 ring-emerald-300/40">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5" /> AI Score {project.score}/100
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[11px] font-black uppercase backdrop-blur-md">
                      {project.submission_language}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <MetaChip icon={<Trophy className="h-3.5 w-3.5" />} label="Score" value={`${project.score}/100`} />
                {project.points_awarded > 0 && (
                  <MetaChip icon={<Sparkles className="h-3.5 w-3.5" />} label="Points" value={`+${project.points_awarded}`} />
                )}
                {project.level && (
                  <MetaChip icon={<Wrench className="h-3.5 w-3.5" />} label="Level" value={project.level} />
                )}
                {created && (
                  <MetaChip icon={<Calendar className="h-3.5 w-3.5" />} label="Built" value={created} />
                )}
              </div>

              {/* The project description the dashboard was missing */}
              <section>
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                  <MessageSquare className="h-4 w-4" /> Project description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {project.task_description}
                </p>
              </section>

              {project.feedback && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                    <Sparkles className="h-4 w-4" /> AI review
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {project.feedback}
                  </p>
                </section>
              )}

              {strengths.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Strengths
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {strengths.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {improvements.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                    <Wrench className="h-4 w-4" /> Suggested improvements
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {improvements.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {project.explanation && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                    <MessageSquare className="h-4 w-4" /> Approach and validation
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {project.explanation}
                  </p>
                </section>
              )}

              {project.submission && (
                <details className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                  <summary className="flex cursor-pointer list-none items-center gap-2 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:bg-white/[0.04] dark:text-slate-200">
                    <Code2 className="h-4 w-4" /> View submitted solution
                  </summary>
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-slate-950 p-4 font-mono text-xs leading-6 text-sky-100">
                    {project.submission}
                  </pre>
                </details>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {project.ai_enriched
                  ? "Evaluated by the CalibiAI AI rubric"
                  : "Evaluated by the deterministic fallback rubric"}
                {project.points_awarded > 0 ? ` · +${project.points_awarded} points on this attempt` : ""}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Clickable card ───────────────────────────────────────────── */

export function LabProjectCard({ project }: { project: LabProjectDetail }) {
  const [open, setOpen] = useState(false);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={onKey}
        aria-label={`View AI Lab day ${project.day} project details`}
        className="group cursor-pointer rounded-2xl border border-violet-200 bg-violet-50/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-violet-900 dark:bg-violet-950/20 dark:hover:border-violet-400/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-violet-600 dark:text-violet-300">
              AI Lab · Day {project.day}
            </p>
            <p className="mt-1 line-clamp-2 font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-200">
              {project.task_description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Verified
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
          </div>
        </div>

        {/* Short description preview, so the card is informative before opening */}
        {project.feedback && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
            {project.feedback}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className={`font-bold ${scoreTone(project.score)}`}>AI Score: {project.score}/100</span>
          <span className="font-mono uppercase text-slate-500">{project.submission_language}</span>
          {project.points_awarded > 0 && (
            <span className="font-bold text-amber-600">+{project.points_awarded} points</span>
          )}
        </div>

        <p className="mt-2 text-xs font-semibold text-violet-600/80 opacity-0 transition group-hover:opacity-100 dark:text-violet-300/80">
          Click to view full details
        </p>
      </div>

      <LabProjectModal project={project} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
