"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Github,
  ExternalLink,
  Trophy,
  CheckCircle2,
  Layers,
  Calendar,
  Sparkles,
  Code2,
  Wrench,
  MessageSquare,
  ChevronRight,
  Star,
} from "lucide-react";

/**
 * Full project shape used by the clickable project cards + detail popup.
 * All fields except `title` are optional so the component works for both the
 * student dashboard (lighter query) and the public verified profile (richer
 * query) without extra mapping.
 */
export type ProjectDetail = {
  id?: string | null;
  title: string;
  description?: string | null;
  repo_url?: string | null;
  live_url?: string | null;
  ai_score?: number | null;
  verified?: boolean | null;
  complexity_tier?: string | number | null;
  points_awarded?: number | null;
  created_at?: string | null;
  how_it_works?: string | null;
  tech_stack?: string | null;
  ai_feedback?: string | null;
  ai_strengths?: string[] | null;
  ai_improvements?: string[] | null;
};

function getInitials(name?: string | null) {
  return (
    String(name ?? "AI")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AI"
  );
}

function normalizeTier(tier?: string | number | null) {
  return String(tier ?? "beginner").replace(/[_-]/g, " ");
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v)).filter(Boolean);
    } catch {
      /* not JSON — fall through */
    }
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* ── Small presentational helpers ─────────────────────────────── */

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 shadow-[0_0_18px_rgba(16,185,129,0.18)] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
      Verified
    </span>
  );
}

function MetaChip({
  icon,
  label,
  value,
  tone = "slate",
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "slate" | "brand" | "amber" | "emerald";
}) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200",
    brand: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-200",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold capitalize ${tones[tone]}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wide opacity-60">{label}</span>
      <span className="normal-case">{value}</span>
    </span>
  );
}

/* ── The full-detail popup ────────────────────────────────────── */

export function ProjectDetailModal({
  project,
  open,
  onClose,
}: {
  project: ProjectDetail;
  open: boolean;
  onClose: () => void;
}) {
  // Close on Escape + lock body scroll while open.
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

  const strengths = asStringArray(project.ai_strengths);
  const improvements = asStringArray(project.ai_improvements);
  const created = formatDate(project.created_at);

  return (
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
          aria-label={`${project.title} details`}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="modal-glass relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-brand-700 to-violet-700 p-5 text-white sm:p-6">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <button
                onClick={onClose}
                aria-label="Close project details"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative flex items-start gap-4 pr-10">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-mono text-lg font-black backdrop-blur-md sm:h-16 sm:w-16 sm:text-xl">
                  {getInitials(project.title)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black leading-tight sm:text-2xl">{project.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {project.verified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-black text-emerald-100 ring-1 ring-emerald-300/40">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black capitalize backdrop-blur-md">
                      <Layers className="h-3.5 w-3.5" /> {normalizeTier(project.complexity_tier)}
                    </span>
                    {project.ai_score != null && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5" /> AI Score {project.ai_score}/100
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
              {/* Quick stats */}
              <div className="flex flex-wrap gap-2">
                {project.ai_score != null && (
                  <MetaChip icon={<Trophy className="h-3.5 w-3.5" />} label="AI Score" value={`${project.ai_score}/100`} tone="brand" />
                )}
                <MetaChip icon={<Layers className="h-3.5 w-3.5" />} label="Tier" value={normalizeTier(project.complexity_tier)} tone="slate" />
                {project.points_awarded != null && project.points_awarded > 0 && (
                  <MetaChip icon={<Star className="h-3.5 w-3.5" />} label="Points" value={`+${project.points_awarded}`} tone="amber" />
                )}
                {created && <MetaChip icon={<Calendar className="h-3.5 w-3.5" />} label="Built" value={created} tone="slate" />}
              </div>

              {/* Full description */}
              <section>
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
                  <MessageSquare className="h-4 w-4" /> About this project
                </h3>
                {project.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {project.description}
                  </p>
                ) : (
                  <p className="mt-2 text-sm italic text-slate-400 dark:text-slate-500">No description provided.</p>
                )}
              </section>

              {/* How it works */}
              {project.how_it_works && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                    <Code2 className="h-4 w-4" /> How it works
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {project.how_it_works}
                  </p>
                </section>
              )}

              {/* Tech stack */}
              {project.tech_stack && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                    <Wrench className="h-4 w-4" /> Tech stack
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {asStringArray(project.tech_stack).length > 0 ? (
                      asStringArray(project.tech_stack).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        >
                          {tech}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-200">{project.tech_stack}</p>
                    )}
                  </div>
                </section>
              )}

              {/* AI feedback */}
              {project.ai_feedback && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
                    <Sparkles className="h-4 w-4" /> AI review
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-7 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                    {project.ai_feedback}
                  </p>
                </section>
              )}

              {/* Strengths & improvements */}
              {(strengths.length > 0 || improvements.length > 0) && (
                <section className="grid gap-4 sm:grid-cols-2">
                  {strengths.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Strengths</h4>
                      <ul className="mt-2 space-y-1.5">
                        {strengths.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {improvements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">Could improve</h4>
                      <ul className="mt-2 space-y-1.5">
                        {improvements.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Footer links */}
            {(project.repo_url || project.live_url) && (
              <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-slate-200/70 bg-white/40 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
                {project.repo_url && (
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <Github className="h-4 w-4" /> View repository
                  </a>
                )}
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-200"
                  >
                    <ExternalLink className="h-4 w-4" /> Live demo
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Clickable card (dashboard + profile variants) ────────────── */

export function ProjectCard({
  project,
  variant = "profile",
}: {
  project: ProjectDetail;
  variant?: "dashboard" | "profile";
}) {
  const [open, setOpen] = useState(false);

  const openModal = () => setOpen(true);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal();
    }
  };

  return (
    <>
      {variant === "dashboard" ? (
        <div
          role="button"
          tabIndex={0}
          onClick={openModal}
          onKeyDown={onKey}
          className="group w-full cursor-pointer rounded-2xl border border-slate-100 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:hover:border-brand-300/40"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold group-hover:text-brand-700">{project.title}</p>
            <div className="flex items-center gap-2">
              {project.verified && (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                  Verified
                </span>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </div>
          </div>
          {project.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{project.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="font-medium text-brand-700">AI Score: {project.ai_score ?? "—"}</span>
            <span className="capitalize text-slate-500">{normalizeTier(project.complexity_tier)}</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-brand-600/80 opacity-0 transition group-hover:opacity-100 dark:text-brand-300/80">
            Click to view full details
          </p>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={openModal}
          onKeyDown={onKey}
          className="group w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-left backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-brand-300/40"
        >
          <div className="flex gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-brand-700 to-violet-700 font-mono text-lg font-black text-white shadow-lg shadow-brand-500/15">
              {getInitials(project.title)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-black text-slate-950 group-hover:text-brand-700 dark:text-white">
                  {project.title}
                </h3>
                <div className="flex items-center gap-2">
                  {project.verified && <VerifiedBadge />}
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {project.description || "No description provided."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold">
                {project.repo_url && (
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-600 dark:text-brand-300"
                  >
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-600 dark:text-indigo-300"
                  >
                    Live <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {project.ai_score != null && (
                  <span className="rounded-lg bg-slate-950 px-2.5 py-1 font-mono text-sky-100 dark:bg-white/10">
                    AI Score: {project.ai_score}/100
                  </span>
                )}
                <span className="ml-auto text-[11px] font-semibold text-brand-600/70 opacity-0 transition group-hover:opacity-100 dark:text-brand-300/70">
                  View full details →
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProjectDetailModal project={project} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
