import Link from "next/link";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurriculumCatalog, getCurriculumStats } from "@/lib/curriculum/catalog";
import { getUserProgressMap } from "./actions";

export const dynamic = "force-dynamic";

const phaseIcons = [Layers, Brain, Code2, Sparkles, GraduationCap, Trophy, BookOpen];

export default async function ResourcesPage() {
  const catalog = getCurriculumCatalog();
  const stats = getCurriculumStats();

  let userId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* offline */
  }

  const progressMap = userId ? await getUserProgressMap(userId) : new Map();

  let completedModules = 0;
  let totalProgressSum = 0;
  for (const p of catalog) {
    for (const m of p.modules) {
      const row = progressMap.get(m.id);
      if (row?.completed || (row?.progressPct ?? 0) >= 95) completedModules += 1;
      totalProgressSum += row?.progressPct ?? 0;
    }
  }
  const overallPct =
    stats.modules > 0 ? Math.round(totalProgressSum / stats.modules) : 0;

  // Continue reading — highest progress incomplete, or most recent
  let continueMod: { phaseId: string; slug: string; title: string; pct: number } | null = null;
  const inProgress = [...progressMap.values()]
    .filter((r) => r.progressPct > 0 && r.progressPct < 95)
    .sort((a, b) => b.progressPct - a.progressPct);
  if (inProgress[0]) {
    const m = catalog.flatMap((p) => p.modules).find((x) => x.id === inProgress[0]!.moduleId);
    if (m) {
      continueMod = {
        phaseId: m.phaseId,
        slug: m.slug,
        title: m.title,
        pct: inProgress[0]!.progressPct,
      };
    }
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-10 dark:border-slate-800">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200 backdrop-blur">
            <BookOpen className="h-3.5 w-3.5" />
            Resource Hub · Live curriculum
          </div>
          <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            Master applied AI from the full Phases curriculum
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Every lesson from the GitHub <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-200">phases/</code>{" "}
            folder — setup, math, ML, transformers, LLM engineering, agents, and capstones. Your reading progress is
            tracked per module.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-black">{stats.phases}</p>
              <p className="text-xs font-semibold text-slate-300">Phases</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-black">{stats.modules}</p>
              <p className="text-xs font-semibold text-slate-300">Modules</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-black">{overallPct}%</p>
              <p className="text-xs font-semibold text-slate-300">Your progress</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-2xl font-black">{completedModules}</p>
              <p className="text-xs font-semibold text-slate-300">Completed</p>
            </div>
          </div>

          {continueMod && (
            <Link
              href={`/community/resources/${continueMod.phaseId}/${continueMod.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-cyan-50"
            >
              Continue · {continueMod.title.slice(0, 48)}
              {continueMod.title.length > 48 ? "…" : ""}
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                {continueMod.pct}%
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}

          {!userId && (
            <p className="mt-4 text-xs text-slate-400">
              <Link href="/signin?mode=sign-in" className="font-bold text-cyan-300 hover:underline">
                Student sign in
              </Link>{" "}
              to save reading progress across devices.
            </p>
          )}
        </div>
      </section>

      {/* Overall bar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-primary">Your learning path</h2>
            <p className="text-sm text-secondary">
              Progress is stored per module when you scroll through lessons.
            </p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            {overallPct}% curriculum read
          </span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-cyan-400 to-violet-500 transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </section>

      {/* Phase grid */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-primary">All phases</h2>
            <p className="mt-1 text-sm text-secondary">
              Open a phase to browse modules, then read with a live top progress line.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-subtle sm:flex">
            <Search className="h-3.5 w-3.5" />
            {stats.modules} lessons indexed from repo
          </div>
        </div>

        {catalog.length === 0 ? (
          <div className="card text-center">
            <p className="font-bold text-primary">Curriculum folder not found</p>
            <p className="mt-2 text-sm text-secondary">
              Expected a <code>phases/</code> directory at the project root.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.map((phase, idx) => {
              const Icon = phaseIcons[idx % phaseIcons.length]!;
              const moduleProgress = phase.modules.map((m) => progressMap.get(m.id)?.progressPct ?? 0);
              const phasePct =
                phase.moduleCount > 0
                  ? Math.round(moduleProgress.reduce((a, b) => a + b, 0) / phase.moduleCount)
                  : 0;
              const done = moduleProgress.filter((p) => p >= 95).length;

              return (
                <Link
                  key={phase.id}
                  href={`/community/resources/${phase.id}`}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${phase.accent} opacity-80 transition-opacity group-hover:opacity-100`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${phase.accent} text-white shadow-md`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Phase {String(phase.order).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-black text-primary group-hover:text-brand-700 dark:group-hover:text-brand-300">
                    {phase.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-secondary">
                    {phase.summary || `${phase.moduleCount} hands-on modules`}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-subtle">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {phase.moduleCount} modules
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {done} done
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${phase.accent}`}
                      style={{ width: `${phasePct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-xs font-bold text-brand-600 dark:text-brand-400">
                    {phasePct}% · Open phase →
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured modules strip */}
      <section>
        <h2 className="text-xl font-black text-primary">Start here</h2>
        <p className="mt-1 text-sm text-secondary">Popular entry modules across the curriculum.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {catalog
            .slice(0, 4)
            .flatMap((p) => p.modules.slice(0, 2).map((m) => ({ ...m, phaseTitle: p.title, accent: p.accent })))
            .slice(0, 6)
            .map((m) => {
              const pct = progressMap.get(m.id)?.progressPct ?? 0;
              return (
                <Link
                  key={m.id}
                  href={`/community/resources/${m.phaseId}/${m.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${m.accent} text-sm font-black text-white`}
                  >
                    {String(m.order).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold uppercase tracking-wide text-subtle">
                      {m.phaseTitle}
                    </p>
                    <p className="truncate font-bold text-primary">{m.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-secondary">
                      {m.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {m.time}
                        </span>
                      )}
                      {m.hasCode && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold dark:bg-slate-800">
                          Code
                        </span>
                      )}
                      {m.hasQuiz && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                          Quiz
                        </span>
                      )}
                      <span className="ml-auto font-bold text-brand-600">{pct}%</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}
