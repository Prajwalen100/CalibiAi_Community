"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, CheckCircle2, Trophy, ExternalLink,
  Github, Sparkles, Terminal, Cpu, Flame
} from "lucide-react";

export function HeroArcadeDemo() {
  const [activeTab, setActiveTab] = useState<"projects" | "score" | "review">("projects");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
      className="relative mx-auto w-full max-w-xl"
    >
      {/* Outer Glow Background Ring (Arcade theme style) */}
      <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-r from-brand-500/30 via-purple-500/20 to-indigo-500/30 blur-2xl opacity-70 animate-pulse pointer-events-none" />

      {/* Main Glass Arcade Frame */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/80 p-6 backdrop-blur-2xl shadow-2xl dark:border-slate-800/80 dark:bg-slate-900/85">
        {/* Top Window Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
              app.calibiai.com/profile/demo
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live Audit Engine
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mt-4 flex rounded-xl bg-slate-100/80 p-1.5 backdrop-blur-md dark:bg-slate-800/80">
          {[
            { id: "projects", label: "Live Projects", icon: Cpu },
            { id: "score", label: "Talent Score", icon: Trophy },
            { id: "review", label: "AI Verification", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "text-brand-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-700"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Content with Animations */}
        <div className="mt-5 min-h-[260px]">
          <AnimatePresence mode="wait">
            {activeTab === "projects" && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Verified Project Card 1 */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-brand-500/50 dark:border-slate-800 dark:bg-slate-800/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950/80 dark:text-brand-300">
                          RAG & Embeddings
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified Pass
                        </span>
                      </div>
                      <h4 className="mt-1.5 font-bold text-slate-900 dark:text-white text-sm">
                        Enterprise PDF RAG Engine with Titan Embeddings
                      </h4>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      +240 Pts
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed dark:text-slate-300">
                    Deployed vector search, exact citation tracing, and Bedrock Sonnet orchestration.
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-semibold hover:text-brand-600 dark:hover:text-brand-400">
                      <Github className="h-3.5 w-3.5" /> github.com/prajwal/rag-engine
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                      <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                    </span>
                  </div>
                </div>

                {/* Verified Project Card 2 */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-purple-500/50 dark:border-slate-800 dark:bg-slate-800/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                          Prompt Evaluation
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" /> Hands-on Passed
                        </span>
                      </div>
                      <h4 className="mt-1.5 font-bold text-slate-900 dark:text-white text-sm">
                        AI Prompt Regression & Benchmarking Playground
                      </h4>
                    </div>
                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-black text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                      +180 Pts
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "score" && (
              <motion.div
                key="score"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-slate-200/80 bg-slate-950 p-6 text-white dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      CalibiAI Score
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">845</span>
                      <span className="text-sm font-semibold text-slate-400">/ 1000</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Gold Tier
                  </span>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    { label: "Verified Projects", value: "320 / 400 pts", pct: "80%" },
                    { label: "Hands-on Assessments", value: "280 / 300 pts", pct: "93%" },
                    { label: "Community Contributions", value: "145 / 200 pts", pct: "72%" },
                    { label: "Originality Audit", value: "100 / 100 pts", pct: "100%" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs font-medium text-slate-300">
                        <span>{row.label}</span>
                        <span className="font-bold text-white">{row.value}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                          style={{ width: row.pct }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-slate-200/80 bg-slate-900 p-4 font-mono text-xs text-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-brand-400">
                    <Terminal className="h-3.5 w-3.5" /> Amazon Bedrock Reviewer
                  </span>
                  <span>Latency: 280ms</span>
                </div>

                <div className="mt-3 space-y-2 text-slate-300">
                  <p className="text-emerald-400">✔ Originality Audit: PASS (100% human authorship verified)</p>
                  <p className="text-brand-300">✔ GitHub Repo Link: PASS (34 commits, live commits validated)</p>
                  <p className="text-purple-300">✔ Live Demo URL: PASS (HTTPS endpoint responding 200 OK)</p>
                  <div className="mt-3 rounded-xl bg-slate-950 p-3 text-slate-400 text-[11px] border border-slate-800">
                    <p className="font-bold text-white mb-1">Feedback Summary:</p>
                    &quot;Clean modular TypeScript implementation with clear error boundaries and Bedrock client invocation.&quot;
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Interactive Badge (Arcade style callout) */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute -bottom-3 -right-3 rounded-2xl border border-white/60 bg-white/90 p-3 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-green-500/20 text-green-600 dark:text-green-400">
              🎉
            </span>
            <div>
              <p className="text-[11px] font-bold text-slate-900 dark:text-white">Matched with Hiring Partner</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Junior AI Engineer @ CalibiAI Partner</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
