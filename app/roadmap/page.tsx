import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { 
  Calendar, 
  Target, 
  Trophy, 
  TrendingUp, 
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
  Lock
} from "lucide-react";
import { getCurrentDayNumber, getRoadmapDayLockStatuses } from "@/lib/learning/day-lock";
import { getRoadmapContext, maybePromoteStage } from "@/lib/roadmap/service";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  // The roadmap page loads its stage dynamically through the engine, so once
  // Beginner is complete it automatically renders the Intermediate JSON.
  let context = await getRoadmapContext(supabase, user.id);
  if (context.state?.currentStageCompleted) {
    const promotion = await maybePromoteStage(supabase, user.id, context);
    if (promotion.promoted) context = await getRoadmapContext(supabase, user.id);
  }

  const journey = context.state;
  const days = context.current?.days ?? [];
  const weeklyTargets = context.current?.weeklyTargets ?? [];
  const progress = context.progress;
  const totalDays = journey?.stageTotalDays ?? 0;
  const totalWeeks = journey?.stageTotalWeeks ?? 0;
  const assessmentScore = context.assignment?.assessmentScore ?? 0;

  // If no roadmap exists or days array is empty/invalid, redirect to get one assigned
  if (!context.hasRoadmap || days.length === 0) {
    redirect("/roadmap/assign");
  }

  // Stage progress. Day locks still use the pacing engine, now fed rows scoped
  // to the active stage rather than every stage the learner has ever held.
  const completedDays = journey?.stageCompletedDays ?? 0;
  const dayLockMap = getRoadmapDayLockStatuses(days, progress);
  const currentDay = journey?.currentStageDay ?? getCurrentDayNumber(days, dayLockMap);
  const currentWeek = journey?.currentStageWeek ?? Math.ceil(currentDay / 7);
  const progressPercent = journey?.stageProgressPercent ?? 0;

  // Overall journey figures, spanning both stages.
  const overallProgressPercent = journey?.overallProgressPercent ?? progressPercent;
  const overallCompletedDays = journey?.overallCompletedDays ?? completedDays;
  const overallJourneyDays = journey?.overallJourneyDays ?? totalDays;

  // Group days by week for display
  const weeksData = weeklyTargets.map((week) => {
    const weekDays = days.filter(d => week.days.includes(d.day));
    const weekProgress = week.days.map(day => 
      progress?.find(p => p.day === day)
    );
    const completedCount = weekProgress.filter(p => p?.status === "completed").length;
    
    return {
      ...week,
      days: weekDays,
      completedCount,
      progressPercent: Math.round((completedCount / week.days.length) * 100),
      isCurrentWeek: week.week === currentWeek,
      isCompleted: completedCount === week.days.length,
    };
  });

  // Skill categories for icons
  const skillIcons: Record<string, typeof Code> = {
    "Python": Code,
    "Java": Code,
    "SQL": Database,
    "AWS": Cloud,
    "Docker": Cloud,
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
              {totalDays} days
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4 text-purple-500" />
              {totalWeeks} weeks
            </span>
          </div>
        </div>
        <div className="flex gap-2 max-sm:w-full">
          <Link href={`/roadmap/day/${currentDay}`} className="btn-primary inline-flex items-center gap-2 max-sm:w-full max-sm:justify-center">
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
            <p className="text-sm text-slate-500">{overallCompletedDays}/{overallJourneyDays} days</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all"
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Days Completed</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{completedDays}</p>
          <p className="mt-1 text-sm text-slate-500">{context.stageLabel} · {progressPercent}% of stage</p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Current Day</p>
          <p className="mt-2 text-3xl font-black text-brand-600">{journey?.currentOverallDay ?? currentDay}</p>
          <p className="mt-1 text-sm text-slate-500">Week {journey?.currentOverallWeek ?? currentWeek} · {context.stageLabel} day {currentDay}</p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Weekly Target</p>
          <p className="mt-2 text-3xl font-black text-purple-600">Week {currentWeek}</p>
          <p className="mt-1 text-sm text-slate-500">
            {weeksData[currentWeek - 1]?.completedCount ?? 0}/{weeksData[currentWeek - 1]?.days.length ?? 7} days done
          </p>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="mt-8">
        <h2 className="text-xl font-bold">Weekly Breakdown</h2>
        <div className="mt-4 space-y-4">
          {weeksData.map((week) => (
            <div 
              key={week.week}
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
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${
                    week.isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : week.isCurrentWeek
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {week.isCompleted ? "✓" : week.week}
                  </div>
                  <div>
                    <h3 className="font-bold">{week.title}</h3>
                    <p className="text-sm text-slate-500">{week.focus}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {week.completedCount}/{week.days.length} days
                  </p>
                  <p className="text-xs text-slate-500">
                    {week.progressPercent}% complete
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div 
                  className={`h-full rounded-full transition-all ${
                    week.isCompleted
                      ? "bg-emerald-500"
                      : week.isCurrentWeek
                        ? "bg-brand-500"
                        : "bg-slate-400"
                  }`}
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
                  const st = dayLockMap[day.day];
                  const isCompleted = st?.isCompleted ?? false;
                  const isCurrent = st?.isCurrent ?? false;
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
                      <span className="text-xs font-bold">D{day.day}</span>
                      {isCompleted && <CheckCircle2 className="mt-1 h-3 w-3" />}
                      {isCurrent && <Zap className="mt-1 h-3 w-3" />}
                      {isLocked && <Lock className="mt-1 h-3 w-3" />}
                    </>
                  );

                  // Locked days are not links — the day page would only show a
                  // lock screen, so there is nothing to navigate to.
                  if (isLocked) {
                    return (
                      <div
                        key={day.day}
                        title={st.lockReason}
                        aria-disabled="true"
                        className={tileClass}
                      >
                        {tileBody}
                      </div>
                    );
                  }

                  return (
                    <Link key={day.day} href={`/roadmap/day/${day.day}`} className={tileClass}>
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
          <Link href={`/roadmap/day/${currentDay}`} className="text-sm font-semibold text-brand-700 hover:text-brand-600">
            Start Today →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {days.slice(0, 6).map((day) => {
            const st = dayLockMap[day.day];
            const isCompleted = st?.isCompleted ?? false;
            const isCurrent = st?.isCurrent ?? false;
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
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : isCurrent
                          ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
                          : isLocked
                            ? "bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {isCompleted ? "✓" : isLocked ? <Lock className="h-4 w-4" /> : day.day}
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-brand-700">Day {day.day}</p>
                      <p className="text-xs text-slate-500">{day.estimated_time ?? "2-3 hours"}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                      Today
                    </span>
                  )}
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-100/90 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300">
                      <Clock className="h-3 w-3" />
                      {isDailyReset ? "12 AM Reset" : `Complete D${day.day - 1}`}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-bold">{day.title}</h3>
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
                {day.expected_outcome && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">{day.expected_outcome}</p>
                )}
              </>
            );

            // Locked days stay unclickable so a student cannot jump ahead.
            if (isLocked) {
              return (
                <div key={day.day} aria-disabled="true" title={st?.lockReason} className={cardClass}>
                  {cardBody}
                </div>
              );
            }

            return (
              <Link key={day.day} href={`/roadmap/day/${day.day}`} className={cardClass}>
                {cardBody}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
