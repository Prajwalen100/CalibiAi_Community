"use client";

import { useEffect, useState, useRef } from "react";
import {
  BarChart3,
  CheckCircle2,
  FolderGit2,
  Brain,
  Code2,
  Cpu,
  Network,
  Sparkles,
  MousePointerClick,
} from "lucide-react";

type Tier = {
  label: string;
  /** Tailwind text color classes for the rating label */
  color: string;
  /** Tailwind ring/shadow classes for the draggable thumb */
  dot: string;
  /** Tailwind gradient stops for the filled bar */
  track: string;
};

// Four evenly-spaced rating tiers. `Excellent` keeps the original brand
// gradient so the card looks identical to the design at rest (score 94).
const TIERS: Tier[] = [
  {
    label: "Poor",
    color: "text-rose-600 dark:text-rose-400",
    dot: "ring-rose-400/70 shadow-rose-500/50",
    track: "from-rose-500 to-orange-500",
  },
  {
    label: "Medium",
    color: "text-amber-600 dark:text-amber-400",
    dot: "ring-amber-400/70 shadow-amber-500/50",
    track: "from-amber-500 to-yellow-500",
  },
  {
    label: "Good",
    color: "text-sky-600 dark:text-sky-400",
    dot: "ring-sky-400/70 shadow-sky-500/50",
    track: "from-sky-500 to-blue-500",
  },
  {
    label: "Excellent",
    color: "text-emerald-600 dark:text-emerald-400",
    dot: "ring-emerald-400/70 shadow-emerald-500/50",
    track: "from-blue-500 via-indigo-500 to-purple-500",
  },
];

function getTier(value: number): Tier {
  if (value < 25) return TIERS[0];
  if (value < 50) return TIERS[1];
  if (value < 75) return TIERS[2];
  return TIERS[3];
}

export function LiveAuditCard() {
  const [score, setScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const introCancelledRef = useRef(false);

  const tier = getTier(score);

  // Reveal animation when scrolled into view.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Intro: count the score up to 94 once visible, unless the user grabs the
  // slider first (which cancels the intro so it never fights the user).
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      let current = 0;
      const target = 94;
      const step = () => {
        if (introCancelledRef.current) return;
        current += 2;
        if (current <= target) {
          setScore(current);
          requestAnimationFrame(step);
        } else {
          setScore(target);
        }
      };
      requestAnimationFrame(step);
    }, 400);
    return () => clearTimeout(timer);
  }, [isVisible]);

  function setScoreFromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const pct = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, pct));
    setScore(Math.round(clamped * 100));
  }

  function cancelIntro() {
    introCancelledRef.current = true;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    cancelIntro();
    draggingRef.current = true;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore unsupported environments */
    }
    setScoreFromClientX(e.clientX);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setScoreFromClientX(e.clientX);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    let next = score;
    const big = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = score + big;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = score - big;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else return;
    e.preventDefault();
    cancelIntro();
    setScore(Math.max(0, Math.min(100, next)));
  }

  const skills = [
    { label: "ML", icon: Brain, color: "text-purple-600 dark:text-purple-400", glow: "shadow-purple-500/20" },
    { label: "Python", icon: Code2, color: "text-blue-600 dark:text-blue-400", glow: "shadow-blue-500/20" },
    { label: "TensorFlow", icon: Cpu, color: "text-amber-600 dark:text-amber-400", glow: "shadow-amber-500/20" },
    { label: "Neural Nets", icon: Network, color: "text-emerald-600 dark:text-emerald-400", glow: "shadow-emerald-500/20" },
  ];

  const projects = [
    { name: "Vision Transformer", tag: "Computer Vision", icon: "🔬" },
    { name: "NLP Pipeline", tag: "Transformers", icon: "📝" },
    { name: "RL Agent", tag: "Reinforcement", icon: "🤖" },
  ];

  return (
    <div
      ref={cardRef}
      className="glass relative group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl p-6 sm:p-8 cursor-default"
    >
      {/* Subtle background glow */}
      <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">
              Live Audit Engine
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-white/50">
              Real-time portfolio verification
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Portfolio Score (interactive slider) */}
      <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 backdrop-blur-sm dark:border-white/8 dark:bg-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-600 dark:text-white/60">Portfolio Score</span>
          <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tabular-nums dark:from-blue-400 dark:to-indigo-400">
            {score}<span className="text-lg text-slate-400 dark:text-white/30">/100</span>
          </span>
        </div>

        {/* Draggable track. Tall invisible hit area (h-6) wraps the visible
            bar (h-3) so it is comfortable to grab with a cursor or finger. */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Portfolio score — drag to explore your rating"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          aria-valuetext={`${score} out of 100, rated ${tier.label}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          className={`relative flex h-6 w-full cursor-ew-resize touch-none select-none items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:cursor-grabbing dark:focus-visible:ring-offset-slate-900 ${
            dragging ? "cursor-grabbing" : ""
          }`}
        >
          {/* Visible track */}
          <div className="relative h-3 w-full overflow-visible rounded-full bg-slate-200/80 dark:bg-white/10">
            {/* Filled portion */}
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${tier.track} ${
                dragging ? "transition-none" : "transition-[width] duration-700 ease-out"
              }`}
              style={{ width: `${score}%` }}
            />
            {/* Draggable thumb */}
            <div
              className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/70 bg-white shadow-lg ring-2 transition-transform duration-150 ${
                tier.dot
              } ${dragging ? "scale-125" : "group-hover:scale-110 scale-100"}`}
              style={{ left: `${score}%` }}
            />
          </div>
        </div>

        <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-white/40">
          <span>0</span>
          <span className={`font-extrabold transition-colors duration-200 ${tier.color}`}>
            {tier.label}
          </span>
          <span>100</span>
        </div>

        {/* Hint that the bar is interactive */}
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-white/30">
          <MousePointerClick className={`h-3.5 w-3.5 ${dragging ? "animate-pulse" : ""}`} />
          Drag the slider to explore your rating
        </div>
      </div>

      {/* Verified Skills */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-slate-700 dark:text-white/70">Verified Skills</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.label}
              className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-lg ${skill.glow} transition-all duration-300 hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white/80 dark:hover:bg-white/12`}
            >
              <skill.icon className={`h-3.5 w-3.5 ${skill.color}`} />
              {skill.label}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FolderGit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-bold text-slate-700 dark:text-white/70">Recent Projects</span>
        </div>
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.name}
              className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/75 px-3 py-2.5 transition-all duration-200 hover:bg-white dark:border-white/6 dark:bg-white/5 dark:hover:bg-white/8"
            >
              <span className="text-lg">{project.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white/90 truncate">
                  {project.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-white/40">{project.tag}</p>
              </div>
              <Sparkles className="h-3.5 w-3.5 text-amber-500/70 dark:text-amber-400/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
