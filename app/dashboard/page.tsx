import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { Calendar, Target, Trophy, TrendingUp, Zap, BookOpen, CheckCircle2, Clock, ChevronRight, Sparkles, FileText, ArrowRight, Lock } from "lucide-react";
import { DashboardGreeting } from "@/components/dashboard-greeting";
import { ProjectCard, type ProjectDetail } from "@/components/project-detail-modal";
import { LabProjectCard, type LabProjectDetail } from "@/components/lab-project-modal";
import { STATIC_BLOG_POSTS, toBlogPost, type BlogPost } from "@/lib/blog/posts";
import { getCurrentDayNumber, getRoadmapDayLockStatuses, type RoadmapDayLockStatus } from "@/lib/learning/day-lock";
import { recalculateAndPersistScore } from "@/lib/score/recalculate";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";
import { getRoadmapContext, maybePromoteStage, syncJourneyToProfile, getStageProgress } from "@/lib/roadmap/service";
import { selectRecommendedActions, selectTodaysFocus } from "@/lib/roadmap/engine";
import { loadRoadmap } from "@/lib/roadmap/loader";
import type { RoadmapStage } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; onboarding?: string }>;
}) {
  const params = await searchParams;
  const { submitted, onboarding } = params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  const [
    { data: profile },
    { data: storedScore },
    { data: projects },
    { data: roadmapMiniProjects },
    { data: blogData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("scores").select("*").eq("user_id", user.id).single(),
    supabase.from("projects").select("id,title,description,repo_url,live_url,ai_score,verified,complexity_tier,points_awarded,created_at,how_it_works,tech_stack,ai_feedback,ai_strengths,ai_improvements").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase
      .from("roadmap_task_assessments")
      .select("id,user_roadmap_id,day,level,task_description,submission_language,submission,explanation,score,points_awarded,ai_enriched,created_at,feedback,strengths,improvements")
      .eq("user_id", user.id)
      .eq("task_type", "mini_project")
      .eq("passed", true)
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("posts")
      .select("id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at")
      .eq("type", "blog")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const score = !storedScore || Number(storedScore.total) === 0
    ? (await recalculateAndPersistScore(user.id)) ?? storedScore
    : storedScore;

  const publishedBlogs: BlogPost[] = (blogData ?? []).map((row) => toBlogPost(row as Record<string, unknown>));

  let context = await getRoadmapContext(supabase, user.id);

  if (context.state?.currentStageCompleted) {
    const promotion = await maybePromoteStage(supabase, user.id, context);
    if (promotion.promoted) context = await getRoadmapContext(supabase, user.id);
  }

  const journey = context.state;
  if (journey) {
    await syncJourneyToProfile(supabase, user.id, journey);
  }

  const days = context.current?.days ?? [];
  const weeklyTargets = context.current?.weeklyTargets ?? [];
  const totalDays = journey?.stageTotalDays ?? 0;
  const totalWeeks = journey?.stageTotalWeeks ?? 0;

  // Authoritative assessment score: prefer the persisted score from the active
  // stage, but fall back to the submitted assessment result so a null or
  // missing `user_roadmaps.assessment_score` never shows as 0% on the
  // dashboard. Mirrors the same fallback pattern used in `recalculate.ts`.
  const { data: assessmentResult } = await supabase
    .from("assessment_results")
    .select("overall_score")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const storedAssignmentScore = context.assignment?.assessmentScore;
  const assessmentScore =
    (storedAssignmentScore ?? null) !== null
      ? storedAssignmentScore!
      : Number(assessmentResult?.overall_score ?? 0);
  const recentProgress = context.progress;
  const miniProjectKeys = new Set<string>();
  const bestRoadmapMiniProjects = (roadmapMiniProjects ?? []).filter((project) => {
    const key = `${project.user_roadmap_id}:${project.day}`;
    if (miniProjectKeys.has(key)) return false;
    miniProjectKeys.add(key);
    return true;
  }).slice(0, 6);

  // Load both stages for full journey display on dashboard
  const role = context.role;
  const entryStage = (journey?.entryStage ?? context.assignment?.entryStage ?? "beginner") as RoadmapStage;
  const currentStage = (journey?.currentStage ?? context.assignment?.stage ?? "beginner") as RoadmapStage;

  let beginnerLoaded: ReturnType<typeof loadRoadmap> | null = null;
  let intermediateLoaded: ReturnType<typeof loadRoadmap> | null = null;
  if (role) {
    try { beginnerLoaded = loadRoadmap(role, "beginner"); } catch {}
    try { intermediateLoaded = loadRoadmap(role, "intermediate"); } catch {}
  }

  let beginnerProgress: any[] = [];
  let intermediateProgress: any[] = [];
  if (role) {
    try {
      const { data: allAssignments } = await supabase
        .from("user_roadmaps")
        .select("id, roadmap_stage")
        .eq("user_id", user.id)
        .eq("role", role)
        .order("stage_index", { ascending: true });
      const bAssign = allAssignments?.find((a: any) => a.roadmap_stage === "beginner");
      const iAssign = allAssignments?.find((a: any) => a.roadmap_stage === "intermediate");
      if (bAssign) beginnerProgress = await getStageProgress(supabase, user.id, bAssign.id);
      if (iAssign) intermediateProgress = await getStageProgress(supabase, user.id, iAssign.id);
      if (beginnerProgress.length === 0 && currentStage === "beginner") beginnerProgress = recentProgress ?? [];
      if (intermediateProgress.length === 0 && currentStage === "intermediate") intermediateProgress = recentProgress ?? [];
    } catch {
      beginnerProgress = currentStage === "beginner" ? recentProgress ?? [] : [];
      intermediateProgress = currentStage === "intermediate" ? recentProgress ?? [] : [];
    }
  }

  const isFullJourney = entryStage === "beginner" && beginnerLoaded && intermediateLoaded;

  // Lock maps
  const beginnerLockMap: Record<number, RoadmapDayLockStatus> = (() => {
    if (!beginnerLoaded) return {};
    if (currentStage === "intermediate" || journey?.beginnerCompleted) {
      const map: Record<number, RoadmapDayLockStatus> = {};
      for (const d of beginnerLoaded.days) {
        map[d.day] = { dayNumber: d.day, isCompleted: true, isLocked: false, isCurrent: false, status: "completed", lockReason: undefined, unlockAt: null, isDailyResetLock: false };
      }
      return map;
    }
    return getRoadmapDayLockStatuses(beginnerLoaded.days, beginnerProgress ?? []);
  })();

  const intermediateLockMap: Record<number, RoadmapDayLockStatus> = (() => {
    if (!intermediateLoaded) return {};
    if (currentStage === "beginner" && !journey?.beginnerCompleted) {
      const map: Record<number, RoadmapDayLockStatus> = {};
      for (const d of intermediateLoaded.days) {
        map[d.day] = { dayNumber: d.day, isCompleted: false, isLocked: true, isCurrent: false, status: "locked", lockReason: "Complete Beginner stage", unlockAt: null, isDailyResetLock: false };
      }
      return map;
    }
    return getRoadmapDayLockStatuses(intermediateLoaded.days, intermediateProgress ?? []);
  })();

  const daysForLock = currentStage === "beginner" ? (beginnerLoaded?.days ?? days) : (intermediateLoaded?.days ?? days);
  const dayLockMap = currentStage === "beginner" ? (isFullJourney ? beginnerLockMap : getRoadmapDayLockStatuses(days, recentProgress ?? [])) : (isFullJourney ? intermediateLockMap : getRoadmapDayLockStatuses(days, recentProgress ?? []));

  const currentDay = journey?.currentStageDay ?? getCurrentDayNumber(daysForLock, dayLockMap);
  const currentWeek = journey?.currentStageWeek ?? Math.ceil(currentDay / 7);

  const overallWeek = journey?.currentOverallWeek ?? (isFullJourney && currentStage === "intermediate" ? (beginnerLoaded!.totalWeeks + currentWeek) : currentWeek);
  const overallJourneyDays = journey?.overallJourneyDays ?? (isFullJourney ? beginnerLoaded!.totalDays + intermediateLoaded!.totalDays : totalDays);
  const overallJourneyWeeks = journey?.overallJourneyWeeks ?? (isFullJourney ? beginnerLoaded!.totalWeeks + intermediateLoaded!.totalWeeks : totalWeeks);
  const overallCompletedDays = journey?.overallCompletedDays ?? 0;
  const currentOverallDay = journey?.currentOverallDay ?? (isFullJourney && currentStage === "intermediate" ? beginnerLoaded!.totalDays + currentDay : currentDay);

  // Per-week completion - combine for full journey
  let weekProgress: Array<{ week: number; overallWeek: number; stage: RoadmapStage; title: string; focus: string; days: number[]; overallDays: number[]; keyTopics: string[]; completedDays: number; totalDays: number; isCurrentWeek: boolean }>;
  if (isFullJourney && beginnerLoaded && intermediateLoaded) {
    const bWeeks = beginnerLoaded.weeklyTargets.map((w, idx) => ({
      week: w.week,
      overallWeek: idx + 1,
      stage: "beginner" as RoadmapStage,
      title: w.title,
      focus: w.focus,
      days: w.days,
      overallDays: w.days,
      keyTopics: w.keyTopics,
      completedDays: journey?.beginnerCompleted ? w.days.length : (beginnerProgress ?? []).filter((p: any) => w.days.includes(Number(p.day)) && p.status === "completed").length,
      totalDays: w.days.length,
      isCurrentWeek: currentStage === "beginner" ? w.week === currentWeek : false,
    }));
    const offset = beginnerLoaded.totalWeeks;
    const offsetDays = beginnerLoaded.totalDays;
    const iWeeks = intermediateLoaded.weeklyTargets.map((w, idx) => ({
      week: w.week,
      overallWeek: offset + idx + 1,
      stage: "intermediate" as RoadmapStage,
      title: w.title,
      focus: w.focus,
      days: w.days,
      overallDays: w.days.map((d) => d + offsetDays),
      keyTopics: w.keyTopics,
      completedDays: (intermediateProgress ?? []).filter((p: any) => w.days.includes(Number(p.day)) && p.status === "completed").length,
      totalDays: w.days.length,
      isCurrentWeek: currentStage === "intermediate" ? w.week === currentWeek : false,
    }));
    weekProgress = [...bWeeks, ...iWeeks];
  } else {
    weekProgress = weeklyTargets.map(week => ({
      week: week.week,
      overallWeek: week.week,
      stage: currentStage,
      title: week.title,
      focus: week.focus,
      days: week.days,
      overallDays: week.days,
      keyTopics: week.keyTopics,
      completedDays: recentProgress?.filter(p => week.days.includes(Number(p.day)) && p.status === "completed").length ?? 0,
      totalDays: week.days.length,
      isCurrentWeek: week.week === currentWeek,
    }));
  }

  // Today's Focus and Recommended Actions
  const todayFocus = selectTodaysFocus(days, currentDay);

  // Build combined days for recommended actions with overall day numbers
  let combinedDaysForRec: Array<any & { overallDay: number; stage: RoadmapStage; stageDay: number }>;
  if (isFullJourney && beginnerLoaded && intermediateLoaded) {
    const bDays = beginnerLoaded.days.map(d => ({ ...d, stage: "beginner" as RoadmapStage, stageDay: d.day, overallDay: d.day }));
    const iDays = intermediateLoaded.days.map(d => ({ ...d, stage: "intermediate" as RoadmapStage, stageDay: d.day, overallDay: beginnerLoaded!.totalDays + d.day }));
    combinedDaysForRec = [...bDays, ...iDays];
  } else {
    combinedDaysForRec = days.map(d => ({ ...d, stage: currentStage, stageDay: d.day, overallDay: d.day }));
  }

  const recommendedCombined = combinedDaysForRec
    .filter(d => d.overallDay >= currentOverallDay)
    .sort((a, b) => a.overallDay - b.overallDay)
    .slice(0, 8);

  const recommendedDays = recommendedCombined.length > 0 ? recommendedCombined : combinedDaysForRec.slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PullToRefresh />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-semibold text-brand-700 max-lg:text-sm">
            {onboarding === "complete" ? "🎉 Welcome to CalibiAI!" : "Dashboard"}
          </p>
          <h1 className="mt-1.5 text-2xl font-black sm:text-3xl lg:mt-2">Your Learning Journey</h1>
          {context.hasRoadmap && (
            <p className="mt-1 text-slate-600 max-lg:text-sm">
              {context.journeyTitle} • {context.stageLabel} Stage {isFullJourney ? `• ${overallJourneyDays} days total` : ""}
            </p>
          )}
        </div>
      </div>

      {onboarding === "complete" && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p className="font-bold">🎉 Onboarding Complete!</p>
          <p className="mt-1">Your personalized {overallJourneyDays}-day roadmap has been assigned based on your assessment score ({assessmentScore}%).</p>
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 p-5 text-white shadow-xl sm:p-6 lg:mt-6 lg:rounded-3xl lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <DashboardGreeting name={profile?.full_name?.split(" ")[0] ?? profile?.username ?? "Student"} />
          <p className="mt-2 max-w-xl text-brand-100 max-lg:text-sm">&quot;Every expert was once a beginner. The only way to learn is to build, fail, and iterate.&quot;</p>
          <div className="mt-4 flex items-center gap-3 max-sm:flex-col max-sm:items-stretch max-sm:gap-2.5">
            <Link href="/roadmap" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25 transition backdrop-blur-sm max-sm:min-h-[48px] max-sm:justify-center">
              Continue Learning <Zap className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/submit" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50 transition max-sm:min-h-[48px] max-sm:justify-center">
              Submit Project <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {submitted === "1" && (
        <div className="mt-4 rounded-2xl border border-signal/30 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Project submitted successfully!</p>
          <p className="mt-1">CalibiAI Assistant has reviewed your project. Your updated score is reflected below.</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-6 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">CalibiAI Score</p>
            <p className="text-2xl font-black">{score?.total ?? assessmentScorePoints(score?.total)}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Assessment Score</p>
            <p className="text-2xl font-black">{assessmentScore}%</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Days Completed</p>
            <p className="text-2xl font-black">{overallCompletedDays} / {overallJourneyDays}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Current Week</p>
            <p className="text-2xl font-black">Week {overallWeek} of {overallJourneyWeeks}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Reading Engagement</p>
            <p className="text-2xl font-black">{Math.round(score?.reading_pts ?? 0)}%</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Quiz Performance</p>
            <p className="text-2xl font-black">{Math.round((score?.quizzes_pts ?? 0) / 1)}%</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:mt-6 lg:grid-cols-[1fr_1.5fr] lg:gap-6">
        <div className="space-y-4 lg:space-y-5">
          {todayFocus && (() => {
            const focusLock = dayLockMap[todayFocus.day];
            const isFocusLocked = focusLock?.isLocked ?? false;
            const isDailyReset = focusLock?.isDailyResetLock ?? false;

            return (
              <div className={`card transition-all ${isFocusLocked ? "border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/30 dark:border-amber-900/60 dark:from-amber-950/20 dark:to-orange-950/10" : "border-brand-200 bg-gradient-to-br from-brand-50/50 to-purple-50/30 dark:border-brand-800 dark:from-brand-950/20 dark:to-purple-950/10"}`}>
                <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-2">
                  <div className={`flex items-center gap-2 text-sm font-semibold ${isFocusLocked ? "text-amber-700 dark:text-amber-300" : "text-brand-700 dark:text-brand-300"}`}>
                    {isFocusLocked ? <Lock className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    {isFocusLocked ? "Next Scheduled Day (Locked)" : "Today's Focus"}
                  </div>
                  {isFocusLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-100/90 px-2.5 py-0.5 text-xs font-bold text-amber-900 max-sm:w-fit max-sm:py-1 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                      {isDailyReset ? "Unlocks after 12:00 AM reset" : "Complete Previous Day"}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-base font-bold sm:text-lg">Day {currentOverallDay} (Stage day {todayFocus.day}): {todayFocus.title}</p>
                  {isFocusLocked && (
                    <p className="mt-1.5 text-sm font-medium text-amber-800/90 dark:text-amber-200/80">
                      {isDailyReset ? "Great job today! In 24 hours you can only complete 1 day. This day unlocks automatically after 12:00 AM daily reset." : `You must complete Day ${todayFocus.day - 1} before starting Day ${todayFocus.day}.`}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {todayFocus.skills_gained?.map((skill, i) => (
                      <span key={i} className={`rounded-full px-2 py-0.5 text-xs font-medium ${isFocusLocked ? "bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-500 max-sm:flex-wrap max-sm:gap-y-1.5">
                    {todayFocus.estimated_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {todayFocus.estimated_time}
                      </span>
                    )}
                    {todayFocus.has_quiz && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Quiz included
                      </span>
                    )}
                  </div>
                  {todayFocus.expected_outcome && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Goal:</span> {todayFocus.expected_outcome}
                    </p>
                  )}
                </div>
                {isFocusLocked ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button disabled className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-amber-300/80 bg-amber-100/80 px-4 py-2.5 text-sm font-bold text-amber-900 opacity-90 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      <Lock className="h-4 w-4" />
                      {isDailyReset ? "Locked • Unlocks after 12:00 AM reset" : `Locked • Complete Day ${todayFocus.day - 1}`}
                    </button>
                    <Link href={`/roadmap/day/${Math.max(1, currentOverallDay - 1)}`} className="btn-secondary inline-flex w-full items-center justify-center gap-2 text-sm">
                      View Day {Math.max(1, currentOverallDay - 1)} →
                    </Link>
                  </div>
                ) : (
                  <Link href={`/roadmap/day/${currentOverallDay}`} className="btn-primary mt-4 w-full justify-center">
                    Start Today&apos;s Learning (Overall Day {currentOverallDay})
                  </Link>
                )}
              </div>
            );
          })()}

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <Target className="h-4 w-4" />
                Weekly Targets
              </div>
              <span className="text-xs text-slate-500">{overallJourneyWeeks} weeks total</span>
            </div>
            <div className="mt-4 space-y-3">
              {weekProgress.slice(0, 4).map((week) => (
                <div key={`${week.stage}-${week.week}`} className={`rounded-xl border p-3 transition-all ${week.isCurrentWeek ? "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/20" : "border-slate-100 dark:border-slate-800"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${week.completedDays === week.totalDays ? "bg-emerald-100 text-emerald-700" : week.isCurrentWeek ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                        {week.completedDays === week.totalDays ? "✓" : week.overallWeek}
                      </span>
                      <span className="font-semibold">{week.title} <span className="text-[10px] font-normal text-slate-400">W{week.overallWeek}</span></span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {week.completedDays}/{week.totalDays} days
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(week.completedDays / week.totalDays) * 100}%` }} />
                    </div>
                  </div>
                  {week.isCurrentWeek && week.keyTopics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {week.keyTopics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {weekProgress.length > 4 && (
              <Link href="/roadmap" className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600">
                View all {overallJourneyWeeks} weeks <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Your Projects</p>
              <Link href="/dashboard/submit" className="text-sm font-semibold text-brand-700 hover:text-brand-600">
                + Submit new
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {(projects ?? []).map((project) => (
                <ProjectCard key={project.id} variant="dashboard" project={project as ProjectDetail} />
              ))}

              {bestRoadmapMiniProjects.map((project) => (
                <LabProjectCard key={project.id} project={project as LabProjectDetail} />
              ))}

              {(projects?.length ?? 0) === 0 && bestRoadmapMiniProjects.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">No projects yet. Complete a roadmap mini project in the AI Lab to publish your first project!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Recommended next actions • {overallJourneyDays} days journey</p>
            <Link href="/roadmap" className="text-sm font-semibold text-brand-700 hover:text-brand-600">
              Full roadmap
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {recommendedDays.map((day) => {
              const stage = (day as any).stage as RoadmapStage;
              const stageDay = (day as any).stageDay ?? day.day;
              const overallDay = (day as any).overallDay ?? day.day;
              const lockMap = stage === "beginner" ? beginnerLockMap : intermediateLockMap;
              const st = lockMap?.[stageDay] ?? dayLockMap?.[stageDay];
              const isCompleted = st?.isCompleted ?? false;
              const isCurrent = overallDay === currentOverallDay;
              const isLocked = st?.isLocked ?? false;
              const isDailyReset = st?.isDailyResetLock ?? false;

              const rowClass = `group block rounded-2xl border p-4 transition-all ${
                isCompleted
                  ? "border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/20"
                  : isCurrent
                    ? "border-brand-200 bg-brand-50/50 hover:border-brand-500 hover:bg-brand-50 hover:shadow-sm dark:border-brand-800 dark:bg-brand-950/20"
                    : isLocked
                      ? "cursor-not-allowed border-slate-200/80 bg-slate-50/70 opacity-90 dark:border-slate-800/80 dark:bg-slate-900/40"
                      : "border-slate-100 hover:border-brand-500 dark:border-slate-800"
              }`;

              const rowBody = (
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isCompleted ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300" : isCurrent ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300" : isLocked ? "bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {isCompleted ? "✓" : isLocked ? <Lock className="h-4 w-4" /> : overallDay}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold group-hover:text-brand-700">
                      Day {overallDay}: {day.title} <span className="text-xs font-normal text-slate-400">• {stage} {stageDay}</span>
                      {isCurrent && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">Today</span>}
                      {isLocked && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-100/90 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300">
                          <Clock className="h-3 w-3" />
                          {isDailyReset ? "After 12 AM reset" : stage === "intermediate" && currentStage === "beginner" ? "Finish Beginner" : `Complete Day ${overallDay - 1}`}
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {day.skills_gained?.slice(0, 2).map((skill: string, i: number) => (
                        <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {skill}
                        </span>
                      ))}
                      {day.estimated_time && (
                        <span className="flex items-center gap-0.5 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {day.estimated_time}
                        </span>
                      )}
                    </div>
                  </div>
                  {isLocked ? <Lock className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-brand-500" />}
                </div>
              );

              if (isLocked) {
                return (
                  <div key={`${stage}-${stageDay}-${overallDay}`} aria-disabled="true" title={st?.lockReason} className={rowClass}>
                    {rowBody}
                  </div>
                );
              }

              return (
                <Link key={`${stage}-${stageDay}-${overallDay}`} href={`/roadmap/day/${overallDay}`} className={rowClass}>
                  {rowBody}
                </Link>
              );
            })}
          </div>

          {combinedDaysForRec.length > 8 && (
            <Link href="/roadmap" className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600">
              View all {combinedDaysForRec.length} days <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-7 lg:mt-8">
        <div className="mb-3 flex items-center justify-between lg:mb-4 max-lg:gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            <p className="text-sm font-semibold text-slate-500">Student Portal • Blog</p>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600">
            View all blogs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {publishedBlogs.length > 0 ? (
            publishedBlogs.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">{post.category}</span>
                  <span className="text-xs text-slate-500">{post.readTimeMinutes} min</span>
                </div>
                <h3 className="font-bold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">{post.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{post.excerpt}</p>
                <div className="mt-3 flex items-center text-xs font-semibold text-brand-600 group-hover:gap-1 transition-all">Read article <ArrowRight className="h-3.5 w-3.5 ml-1" /></div>
              </Link>
            ))
          ) : (
            STATIC_BLOG_POSTS.slice(0, 3).map((post, idx) => (
              <Link key={idx} href={`/blog/${post.slug}`} className="group block rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">{post.category}</span>
                  <span className="text-xs text-slate-500">{post.readTimeMinutes} min</span>
                </div>
                <h3 className="font-bold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">{post.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{post.excerpt}</p>
                <div className="mt-3 flex items-center text-xs font-semibold text-brand-600 group-hover:gap-1 transition-all">Read article <ArrowRight className="h-3.5 w-3.5 ml-1" /></div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function assessmentScorePoints(total: number | undefined | null): number {
  if (total === undefined || total === null) return 0;
  return total;
}
