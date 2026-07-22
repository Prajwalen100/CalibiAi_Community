import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  HelpCircle,
  ListTree,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getModuleDetail,
  getPhase,
  renderLessonMarkdown,
} from "@/lib/curriculum/catalog";
import { getUserProgressMap } from "../../actions";
import { ModuleScrollProgress } from "../../scroll-progress";

export const dynamic = "force-dynamic";

type Params = Promise<{ phaseId: string; moduleSlug: string }>;

export default async function ModuleReaderPage({ params }: { params: Params }) {
  const { phaseId, moduleSlug } = await params;
  const module = getModuleDetail(phaseId, moduleSlug);
  if (!module) notFound();

  const phase = getPhase(phaseId);
  const html = renderLessonMarkdown(module.content);

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
  const initialPct = progressMap.get(module.id)?.progressPct ?? 0;
  const completed = initialPct >= 95;

  // Extract TOC from headings
  const toc = [...module.content.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => {
    const text = m[1]!.trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
    return { text, id, level: m[0]!.startsWith("###") ? 3 : 2 };
  });

  return (
    <div className="relative pb-16">
      <ModuleScrollProgress
        moduleId={module.id}
        phaseId={module.phaseId}
        initialPct={initialPct}
        isAuthenticated={!!userId}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href={`/community/resources/${phaseId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {phase?.title ?? "Phase"}
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {completed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </span>
          )}
          {!userId && (
            <Link
              href="/signin?mode=sign-in"
              className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 hover:underline dark:bg-amber-950/30 dark:text-amber-200"
            >
              Sign in to save progress
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="min-w-0">
          <header className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                {phase?.title ?? phaseId}
              </span>
              {module.type && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {module.type}
                </span>
              )}
              {module.time && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Clock className="h-3 w-3" /> {module.time}
                </span>
              )}
              {module.hasCode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Code2 className="h-3 w-3" /> Code
                </span>
              )}
              {module.hasQuiz && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  <HelpCircle className="h-3 w-3" /> Quiz
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-primary sm:text-4xl">
              {module.title}
            </h1>
            {module.summary && (
              <p className="mt-3 text-base leading-relaxed text-secondary">{module.summary}</p>
            )}

            {module.objectives.length > 0 && (
              <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/40 dark:bg-brand-950/20">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  Learning objectives
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-brand-950 dark:text-brand-100">
                  {module.objectives.map((o) => (
                    <li key={o} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs font-bold text-subtle">
                <span>Your reading progress</span>
                <span>{initialPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 via-cyan-400 to-violet-500"
                  style={{ width: `${initialPct}%` }}
                />
              </div>
            </div>
          </header>

          <div
            className="lesson-prose rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <nav className="mt-8 grid gap-3 sm:grid-cols-2">
            {module.prev ? (
              <Link
                href={`/community/resources/${module.prev.phaseId}/${module.prev.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-xs font-bold uppercase text-subtle">Previous</p>
                <p className="mt-1 flex items-center gap-2 font-bold text-primary group-hover:text-brand-700">
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-2">{module.prev.title}</span>
                </p>
              </Link>
            ) : (
              <div />
            )}
            {module.next ? (
              <Link
                href={`/community/resources/${module.next.phaseId}/${module.next.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:justify-self-end"
              >
                <p className="text-xs font-bold uppercase text-subtle">Next</p>
                <p className="mt-1 flex items-center justify-end gap-2 font-bold text-primary group-hover:text-brand-700">
                  <span className="line-clamp-2">{module.next.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </p>
              </Link>
            ) : null}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-16 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-subtle">
                <ListTree className="h-3.5 w-3.5" /> On this page
              </p>
              <nav className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto text-sm">
                {toc.length === 0 && (
                  <p className="text-xs text-secondary">Scroll to track reading progress.</p>
                )}
                {toc.map((t) => (
                  <a
                    key={t.id + t.text}
                    href={`#${t.id}`}
                    className={`block rounded-lg px-2 py-1.5 text-secondary transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/30 dark:hover:text-brand-300 ${
                      t.level === 3 ? "ml-3 text-xs" : "font-semibold"
                    }`}
                  >
                    {t.text}
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-cyan-50 p-4 dark:border-slate-800 dark:from-brand-950/30 dark:to-slate-900">
              <p className="flex items-center gap-2 text-xs font-bold text-brand-800 dark:text-brand-200">
                <BookOpen className="h-3.5 w-3.5" /> Tip
              </p>
              <p className="mt-2 text-xs leading-relaxed text-brand-900/80 dark:text-brand-100/80">
                The line at the top of the screen fills as you scroll. Your highest % is saved automatically when
                signed in.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
