import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  HelpCircle,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPhase } from "@/lib/curriculum/catalog";
import { getUserProgressMap } from "../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ phaseId: string }>;

export default async function PhaseDetailPage({ params }: { params: Params }) {
  const { phaseId } = await params;
  const phase = getPhase(phaseId);
  if (!phase) notFound();

  let userId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* ignore */
  }

  const progressMap = userId ? await getUserProgressMap(userId) : new Map();
  const pcts = phase.modules.map((m) => progressMap.get(m.id)?.progressPct ?? 0);
  const phasePct =
    phase.moduleCount > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / phase.moduleCount) : 0;
  const done = pcts.filter((p) => p >= 95).length;

  return (
    <div className="space-y-8 pb-12">
      <Link
        href="/community/resources"
        className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> All phases
      </Link>

      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${phase.accent}`} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Phase {String(phase.order).padStart(2, "0")}
            </p>
            <h1 className="mt-1 text-3xl font-black text-primary">{phase.title}</h1>
            <p className="mt-2 max-w-2xl text-secondary">
              {phase.summary || `${phase.moduleCount} modules from the Phases curriculum.`}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-center dark:border-slate-800 dark:bg-slate-950">
            <p className="text-3xl font-black text-brand-600">{phasePct}%</p>
            <p className="text-xs font-semibold text-subtle">phase progress</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-secondary">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <BookOpen className="h-3.5 w-3.5" /> {phase.moduleCount} modules
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> {done} completed
          </span>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${phase.accent} transition-all`}
            style={{ width: `${phasePct}%` }}
          />
        </div>
      </header>

      <div className="space-y-3">
        {phase.modules.map((m, i) => {
          const pct = progressMap.get(m.id)?.progressPct ?? 0;
          const completed = pct >= 95;
          return (
            <Link
              key={m.id}
              href={`/community/resources/${m.phaseId}/${m.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                  completed
                    ? "bg-emerald-500 text-white"
                    : `bg-gradient-to-br ${phase.accent} text-white`
                }`}
              >
                {completed ? <CheckCircle2 className="h-5 w-5" /> : String(i + 1).padStart(2, "0")}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-primary group-hover:text-brand-700 dark:group-hover:text-brand-300">
                    {m.title}
                  </h2>
                  {m.type && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {m.type}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-secondary">{m.summary}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-subtle">
                  {m.time && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {m.time}
                    </span>
                  )}
                  {m.languages && <span>{m.languages}</span>}
                  {m.hasCode && (
                    <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <Code2 className="h-3 w-3" /> Code lab
                    </span>
                  )}
                  {m.hasQuiz && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <HelpCircle className="h-3 w-3" /> Quiz
                    </span>
                  )}
                </div>

                <div className="mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${phase.accent}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <span className="text-sm font-black text-brand-600 dark:text-brand-400">{pct}%</span>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
