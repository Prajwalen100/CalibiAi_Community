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
} from "lucide-react";

export function LiveAuditCard() {
  const [score, setScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      let current = 0;
      const target = 94;
      const step = () => {
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

      {/* Portfolio Score */}
      <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 backdrop-blur-sm dark:border-white/8 dark:bg-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-600 dark:text-white/60">Portfolio Score</span>
          <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            {score}<span className="text-lg text-slate-400 dark:text-white/30">/100</span>
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000 ease-out relative"
            style={{ width: `${score}%` }}
          >
            {/* Glowing dot at the end */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-lg shadow-blue-500/50" />
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-white/40">
          <span>0</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Excellent</span>
          <span>100</span>
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
