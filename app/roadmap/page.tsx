import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import {
  Calendar,
  Target,
  Trophy,
  Zap,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  PlayCircle,
  Users,
  Code,
  Database,
  Cloud,
  Lock,
} from "lucide-react";
import { getCurrentDayNumber, getRoadmapDayLockStatuses, type RoadmapDayLockStatus } from "@/lib/learning/day-lock";
import { getRoadmapContext, maybePromoteStage, getStageProgress } from "@/lib/roadmap/service";
import { loadRoadmap } from "@/lib/roadmap/loader";
import type { RoadmapStage } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  let context = await getRoadmapContext(supabase, user.id);
  if (context.state?.currentStageCompleted) {
    const promotion = await maybePromoteStage(supabase, user.id, context);
    if (promotion.promoted) context = await getRoadmapContext(supabase, user.id);
  }

  if (!context.hasRoadmap || !context.current) {
    redirect("/roadmap/assign");
  }

  const journey = context.state;
  const progress = context.progress;
  const assessmentScore = context.assignment?.assessmentScore ?? 0;

  const role = context.role!;
  const entryStage = (journey?.entryStage ?? context.assignment?.entryStage ?? "beginner") as RoadmapStage;
  const currentStage = (journey?.currentStage ?? context.assignment?.stage ?? "beginner") as RoadmapStage;

  // Load both stages for beginner-entry (90-day journey) to render full roadmap
  let beginnerLoaded: ReturnType<typeof loadRoadmap> | null = null;
  let intermediateLoaded: ReturnType<typeof loadRoadmap> | null = null;
  try {
    beginnerLoaded = loadRoadmap(role, "beginner");
  } catch {}
  try {
    intermediateLoaded = loadRoadmap(role, "intermediate");
  } catch {}

  // Fetch progress for both stages
  let beginnerProgress: any[] = [];
  let intermediateProgress: any[] = [];
  try {
    const { data: allAssignments } = await supabase
      .from("user_roadmaps")
      .select("id, roadmap_stage, stage_index, status")
      .eq("user_id", user.id)
      .eq("role", role)
      .order("stage_index", { ascending: true });

    const bAssign = allAssignments?.find((a: any) => a.roadmap_stage === "beginner");
    const iAssign = allAssignments?.find((a: any) => a.roadmap_stage === "intermediate");

    if (bAssign) {
      beginnerProgress = await getStageProgress(supabase, user.id, bAssign.id);
    }
    if (iAssign) {
      intermediateProgress = await getStageProgress(supabase, user.id, iAssign.id);
    }
    // Fallback: active stage progress may not be in assignments list due to cache
    if (beginnerProgress.length === 0 && currentStage === "beginner") beginnerProgress = progress;
    if (intermediateProgress.length === 0 && currentStage === "intermediate") intermediateProgress = progress;
    if (currentStage === "beginner" && beginnerProgress.length === 0) beginnerProgress = progress;
  } catch {
    beginnerProgress = currentStage === "beginner" ? progress : [];
    intermediateProgress = currentStage === "intermediate" ? progress : [];
  }

  const isFullJourney = entryStage === "beginner" && beginnerLoaded && intermediateLoaded;

  const totalDays = isFullJourney
    ? journey?.overallJourneyDays ?? beginnerLoaded!.totalDays + intermediateLoaded!.totalDays
    : journey?.stageTotalDays ?? context.current.days.length;

  const totalWeeks = isFullJourney
    ? journey?.overallJourneyWeeks ?? beginnerLoaded!.totalWeeks + intermediateLoaded!.totalWeeks
    : journey?.stageTotalWeeks ?? context.current.weeklyTargets.length;

  const completedDays = journey?.stageCompletedDays ?? 0;
  const progressPercent = journey?.stageProgressPercent ?? 0;
  const overallProgressPercent = journey?.overallProgressPercent ?? progressPercent;
  const overallCompletedDays = journey?.overallCompletedDays ?? completedDays;
  const overallJourneyDays = journey?.overallJourneyDays ?? totalDays;
  const overallJourneyWeeks = journey?.overallJourneyWeeks ?? totalWeeks;

  // Lock maps per stage
  const beginnerLockMap: Record<number, RoadmapDayLockStatus> = (() => {
    if (!beginnerLoaded) return {};
    if (currentStage === "intermediate" || journey?.beginnerCompleted) {
      const map: Record<number, RoadmapDayLockStatus> = {};
      for (const d of beginnerLoaded.days) {
        map[d.day] = {
          dayNumber: d.day,
          isCompleted: true,
          isLocked: false,
          isCurrent: false,
          status: "completed",
          lockReason: undefined,
          unlockAt: null,
          isDailyResetLock: false,
        };
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
        map[d.day] = {
          dayNumber: d.day,
          isCompleted: false,
          isLocked: true,
          isCurrent: false,
          status: "locked",
          lockReason: "Complete Beginner stage to unlock Intermediate",
          unlockAt: null,
          isDailyResetLock: false,
        };
      }
      return map;
    }
    return getRoadmapDayLockStatuses(intermediateLoaded.days, intermediateProgress ?? []);
  })();

  const daysForLock = currentStage === "beginner" ? (beginnerLoaded?.days ?? context.current.days) : (intermediateLoaded?.days ?? context.current.days);
  const dayLockMap = currentStage === "beginner" ? beginnerLockMap : intermediateLockMap;

  const currentStageDay = journey?.currentStageDay ?? getCurrentDayNumber(daysForLock, dayLockMap);
  const currentWeekStageLocal = journey?.currentStageWeek ?? Math.ceil(currentStageDay / 7);
  const currentOverallDay = journey?.currentOverallDay ?? (isFullJourney && currentStage === "intermediate" ? beginnerLoaded!.totalDays + currentStageDay : currentStageDay);
  const currentOverallWeek = journey?.currentOverallWeek ?? (isFullJourney && currentStage === "intermediate" ? beginnerLoaded!.totalWeeks + currentWeekStageLocal : currentWeekStageLocal);

  // Combined weeks / days
  type CombinedDay = (typeof context.current.days)[number] & { stage: RoadmapStage; stageDay: number; overallDay: number };
  type CombinedWeek = {
    week: number;
    overallWeek: number;
    stage: RoadmapStage;
    stageLocalWeek: number;
    title: string;
    focus: string;
    days: CombinedDay[];
    keyTopics: string[];
    milestones: string[];
    completedCount: number;
    progressPercent: number;
    isCurrentWeek: boolean;
    isCompleted: boolean;
  };

  let weeksData: CombinedWeek[] = [];
  let allCombinedDays: CombinedDay[] = [];

  if (isFullJourney && beginnerLoaded && intermediateLoaded) {
    const bDays: CombinedDay[] = beginnerLoaded.days.map((d: any) => ({
      ...d,
      stage: "beginner" as RoadmapStage,
      stageDay: d.day,
      overallDay: d.day,
    }));
    const iDays: CombinedDay[] = intermediateLoaded.days.map((d: any) => ({
      ...d,
      stage: "intermediate" as RoadmapStage,
      stageDay: d.day,
      overallDay: beginnerLoaded!.totalDays + d.day,
    }));
    allCombinedDays = [...bDays, ...iDays];

    const bWeeks: CombinedWeek[] = beginnerLoaded.weeklyTargets.map((w, idx) => {
      const weekDays = bDays.filter((d) => w.days.includes(d.stageDay));
      const progRows = w.days.map((dayNum: number) => (beginnerProgress ?? []).find((p: any) => p.day === dayNum));
      const completedCount = journey?.beginnerCompleted ? w.days.length : progRows.filter((p: any) => p?.status === "completed").length;
      return {
        week: w.week,
        overallWeek: idx + 1,
        stage: "beginner" as RoadmapStage,
        stageLocalWeek: w.week,
        title: `${w.title} • Beginner`,
        focus: w.focus,
        days: weekDays,
        keyTopics: w.keyTopics,
        milestones: w.milestones,
        completedCount,
        progressPercent: Math.round((completedCount / w.days.length) * 100),
        isCurrentWeek: currentStage === "beginner" ? w.week === currentWeekStageLocal : false,
        isCompleted: completedCount === w.days.length,
      };
    });

    const offsetWeeks = beginnerLoaded.totalWeeks;
    const iWeeks: CombinedWeek[] = intermediateLoaded.weeklyTargets.map((w, idx) => {
      const weekDays = iDays.filter((d) => w.days.includes(d.stageDay));
      const progRows = w.days.map((dayNum: number) => (intermediateProgress ?? []).find((p: any) => p.day === dayNum));
      const completedCount = progRows.filter((p: any) => p?.status === "completed").length;
      const overallWeek = offsetWeeks + idx + 1;
      return {
        week: overallWeek,
        overallWeek,
        stage: "intermediate" as RoadmapStage,
        stageLocalWeek: w.week,
        title: `${w.title} • Intermediate`,
        focus: w.focus,
        days: weekDays,
        keyTopics: w.keyTopics,
        milestones: w.milestones,
        completedCount,
        progressPercent: Math.round((completedCount / w.days.length) * 100),
        isCurrentWeek: currentStage === "intermediate" ? w.week === currentWeekStageLocal : false,
        isCompleted: completedCount === w.days.length,
      };
    });

    weeksData = [...bWeeks, ...iWeeks];
  } else {
    const days = context.current.days;
    const weeklyTargets = context.current.weeklyTargets;
    const progressRows = progress;
    const curWeek = currentWeekStageLocal;
    weeksData = weeklyTargets.map((week: any) => {
      const weekDaysRaw = days.filter((d: any) => week.days.includes(d.day));
      const weekDays: CombinedDay[] = weekDaysRaw.map((d: any) => ({
        ...d,
        stage: currentStage,
        stageDay: d.day,
        overallDay: d.day,
      }));
      const weekProgress = week.days.map((day: number) => progressRows?.find((p: any) => p.day === day));
      const completedCount = weekProgress.filter((p: any) => p?.status === "completed").length;
      return {
        week: week.week,
        overallWeek: week.week,
        stage: currentStage,
        stageLocalWeek: week.week,
        title: week.title,
        focus: week.focus,
        days: weekDays,
        keyTopics: week.keyTopics,
        milestones: week.milestones,
        completedCount,
        progressPercent: Math.round((completedCount / week.days.length) * 100),
        isCurrentWeek: week.week === curWeek,
        isCompleted: completedCount === week.days.length,
      };
    });
    allCombinedDays = days.map((d: any) => ({
      ...d,
      stage: currentStage,
      stageDay: d.day,
      overallDay: d.day,
    }));
  }

  const dailyPreviewDays = (() => {
    const upcoming = allCombinedDays.filter((d) => d.overallDay >= currentOverallDay).sort((a, b) => a.overallDay - b.overallDay);
    if (upcoming.length >= 6) return upcoming.slice(0, 6);
    // near end – backfill earlier
    const earlier = allCombinedDays.filter((d) => d.overallDay < currentOverallDay).sort((a, b) => b.overallDay - a.overallDay);
    return [...upcoming, ...earlier.slice(0, 6 - upcoming.length)];
  })();

  const skillIcons: Record<string, typeof Code> = {
    Python: Code,
    Java: Code,
    SQL: Database,
    AWS: Cloud,
    Docker: Cloud,
    "REST APIs": Users,
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-semibold text-brand-700">Your Roadmap</p>
          <h1 className="mt-1.5 text-2xl font-black sm:text-3xl lg:mt-2">{context.current?.roadmap?.title ?? "Learning Journey"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              Assessment: {assessmentScore}%
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-brand-500" />
              {totalDays} days {isFullJourney && <span className="text-xs">({overallJourneyDays} total)</span>}
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4 text-purple-500" />
              {totalWeeks} weeks
            </span>
            {isFullJourney && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950/40">
                {entryStage === "beginner" ? "Beginner → Intermediate" : "Intermediate"} Journey
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 max-sm:w-full">
          <Link href={`/roadmap/day/${currentOverallDay}`} className="btn-primary inline-flex items-center gap-2 max-sm:w-full max-sm:justify-center">
            <PlayCircle className="h-4 w-4" />
            Continue Learning
          </Link>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-6 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500">Overall Progress</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-black">{overallProgressPercent}%</p>
            <p className="text-sm text-slate-500">
              {overallCompletedDays}/{overallJourneyDays} days
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all" style={{ width: `${overallProgressPercent}%` }} />
          </div>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Days Completed</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{overallCompletedDays}</p>
          <p className="mt-1 text-sm text-slate-500">
            {context.stageLabel} · {progressPercent}% of stage · {completedDays} stage days
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Current Day</p>
          <p className="mt-2 text-3xl font-black text-brand-600">{currentOverallDay}</p>
          <p className="mt-1 text-sm text-slate-500">
            Week {currentOverallWeek} • {context.stageLabel} day {currentStageDay}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Weekly Target</p>
          <p className="mt-2 text-3xl font-black text-purple-600">Week {currentOverallWeek}</p>
          <p className="mt-1 text-sm text-slate-500">
            {weeksData[currentOverallWeek - 1]?.completedCount ?? 0}/{weeksData[currentOverallWeek - 1]?.days.length ?? 7} days done
          </p>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="mt-8">
        <h2 className="text-xl font-bold">Weekly Breakdown {isFullJourney ? `• ${overallJourneyWeeks} weeks • ${overallJourneyDays} days` : ""}</h2>
        <div className="mt-4 space-y-4">
          {weeksData.map((week) => (
            <div
              key={`${week.stage}-${week.week}`}
              className={`rounded-2xl border p-5 transition-all ${
                week.isCompleted
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                  : week.isCurrentWeek
                    ? "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/20"
                    : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Week Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${
                      week.isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : week.isCurrentWeek
                          ? "bg-brand-100 text-brand-700"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {week.isCompleted ? "✓" : week.overallWeek}
                  </div>
                  <div>
                    <h3 className="font-bold">
                      {week.title} <span className="text-xs font-semibold text-slate-400">• W{week.overallWeek}</span>
                    </h3>
                    <p className="text-sm text-slate-500">{week.focus}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {week.completedCount}/{week.days.length} days
                  </p>
                  <p className="text-xs text-slate-500">{week.progressPercent}% complete</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${week.isCompleted ? "bg-emerald-500" : week.isCurrentWeek ? "bg-brand-500" : "bg-slate-400"}`}
                  style={{ width: `${week.progressPercent}%` }}
                />
              </div>

              {/* Key Topics */}
              {week.keyTopics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {week.keyTopics.slice(0, 4).map((topic, i) => (
                    <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Days Preview */}
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {week.days.map((day) => {
                  const lockMap = day.stage === "beginner" ? beginnerLockMap : intermediateLockMap;
                  const st = lockMap[day.stageDay];
                  const isCompleted = st?.isCompleted ?? false;
                  const isCurrent = day.overallDay === currentOverallDay && !isCompleted && !st?.isLocked;
                  const isLocked = st?.isLocked ?? false;

                  const tileClass = `group flex flex-col items-center rounded-xl p-2 transition-all ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : isCurrent
                        ? "bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-950/40 dark:text-brand-300"
                        : isLocked
                          ? "cursor-not-allowed bg-slate-100/70 text-slate-400 dark:bg-slate-900/40 dark:text-slate-500"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`;

                  const tileBody = (
                    <>
                      <span className="text-xs font-bold">D{day.overallDay}</span>
                      <span className="text-[10px] opacity-70">{day.stage === "beginner" ? `B${day.stageDay}` : `I${day.stageDay}`}</span>
                      {isCompleted && <CheckCircle2 className="mt-1 h-3 w-3" />}
                      {isCurrent && <Zap className="mt-1 h-3 w-3" />}
                      {isLocked && <Lock className="mt-1 h-3 w-3" />}
                    </>
                  );

                  if (isLocked) {
                    return (
                      <div key={`${day.stage}-${day.stageDay}`} title={st.lockReason} aria-disabled="true" className={tileClass}>
                        {tileBody}
                      </div>
                    );
                  }

                  return (
                    <Link key={`${day.stage}-${day.stageDay}`} href={`/roadmap/day/${day.overallDay}`} className={tileClass} title={`${day.title} • ${day.stage} day ${day.stageDay} • overall ${day.overallDay}`}>
                      {tileBody}
                    </Link>
                  );
                })}
              </div>

              {/* Milestones */}
              {week.milestones.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500">Week Milestones</p>
                  <div className="mt-1 space-y-1">
                    {week.milestones.slice(0, 2).map((milestone, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-3 w-3 text-brand-500" />
                        <span className="text-slate-600 dark:text-slate-400">{milestone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Daily Learning Tasks */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Daily Learning Tasks</h2>
          <Link href={`/roadmap/day/${currentOverallDay}`} className="text-sm font-semibold text-brand-700 hover:text-brand-600">
            Start Today →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {dailyPreviewDays.map((day) => {
            const lockMap = day.stage === "beginner" ? beginnerLockMap : intermediateLockMap;
            const st = lockMap[day.stageDay];
            const isCompleted = st?.isCompleted ?? false;
            const isCurrent = day.overallDay === currentOverallDay;
            const isLocked = st?.isLocked ?? false;
            const isDailyReset = st?.isDailyResetLock ?? false;

            const cardClass = `group rounded-2xl border p-4 transition-all ${
              isCompleted
                ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/20"
                : isCurrent
                  ? "border-brand-200 bg-brand-50/50 hover:border-brand-500 hover:shadow-md dark:border-brand-800 dark:bg-brand-950/20"
                  : isLocked
                    ? "cursor-not-allowed border-slate-200/80 bg-slate-50/70 opacity-90 dark:border-slate-800/80 dark:bg-slate-900/40"
                    : "border-slate-200 hover:border-brand-500 hover:shadow-md dark:border-slate-800"
            }`;

            const cardBody = (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                          : isCurrent
                            ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
                            : isLocked
                              ? "bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {isCompleted ? "✓" : isLocked ? <Lock className="h-4 w-4" /> : day.overallDay}
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-brand-700">
                        Day {day.overallDay} <span className="text-xs font-normal text-slate-400">• {day.stage} {day.stageDay}</span>
                      </p>
                      <p className="text-xs text-slate-500">{day.estimated_time ?? "2-3 hours"}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">Today</span>
                  )}
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-100/90 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300">
                      <Clock className="h-3 w-3" />
                      {isDailyReset ? "12 AM Reset" : day.stage === "intermediate" && currentStage === "beginner" ? "Finish Beginner" : `Complete D${day.overallDay - 1}`}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-bold line-clamp-2">{day.title}</h3>
                {day.skills_gained && day.skills_gained.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {day.skills_gained.slice(0, 2).map((skill, i) => {
                      const Icon = skillIcons[skill] ?? BookOpen;
                      return (
                        <span key={i} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <Icon className="h-3 w-3" />
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                )}
                {day.expected_outcome && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{day.expected_outcome}</p>}
              </>
            );

            if (isLocked) {
              return (
                <div key={`${day.stage}-${day.stageDay}`} aria-disabled="true" title={st?.lockReason} className={cardClass}>
                  {cardBody}
                </div>
              );
            }

            return (
              <Link key={`${day.stage}-${day.stageDay}`} href={`/roadmap/day/${day.overallDay}`} className={cardClass}>
                {cardBody}
              </Link>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <Link href="/roadmap" className="text-sm font-semibold text-slate-500">
            Showing {dailyPreviewDays.length} of {allCombinedDays.length} days • Full journey {overallJourneyWeeks} weeks
          </Link>
        </div>
      </div>
    </section>
  );
}
