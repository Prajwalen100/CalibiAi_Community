import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { getArticleSlug } from "@/lib/learning/article-link";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Target,
  BookOpen,
  PlayCircle,
  ExternalLink,
  Video,
  FileText,
  Sparkles,
  Lock
} from "lucide-react";
import { getNextMidnightUTC, getRoadmapDayLockStatus } from "@/lib/learning/day-lock";

export const dynamic = "force-dynamic";

type AssignedRoadmapDay = {
  day: number;
  week?: number;
  title: string;
  objectives?: string[];
  topics?: string[];
  estimated_time?: string;
  difficulty?: string;
  practical_task?: string;
  mini_project?: string;
  assignment?: string;
  expected_outcome?: string;
  skills_gained?: string[];
  resources?: {
    youtube?: { title: string; channel: string; url: string }[];
    docs?: { title: string; url: string }[];
  };
  has_quiz?: boolean;
};

type StoredRoadmap = {
  roadmap?: {
    title?: string;
    role?: string;
    level?: string;
    total_days?: number;
  };
  days?: AssignedRoadmapDay[];
  totalDays?: number;
};

export default async function DayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: dayParam } = await params;
  const dayNumber = parseInt(dayParam, 10);
  
  if (isNaN(dayNumber) || dayNumber < 1) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  const [{ data: roadmap }, { data: progress }, { data: profile }] = await Promise.all([
    supabase.from("roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("roadmap_progress").select("day,status").eq("user_id", user.id).order("day", { ascending: true }),
    supabase.from("profiles").select("username").eq("user_id", user.id).single(),
  ]);

  const plan = roadmap?.generated_plan as StoredRoadmap | undefined;
  const days = plan?.days ?? [];
  const totalDays = plan?.totalDays ?? (plan?.days?.length ?? 0);

  // If no roadmap exists or days array is empty/invalid, redirect to get one assigned
  if (!plan || !Array.isArray(days) || days.length === 0) {
    redirect("/roadmap/assign");
  }

  // Check if day number is valid AFTER we know days array is not empty
  if (dayNumber > totalDays || dayNumber < 1) {
    redirect("/roadmap");
  }

  const currentDay = days.find(d => d.day === dayNumber);
  const currentProgress = progress?.find(p => p.day === dayNumber);
  const prevDay = dayNumber > 1 ? days.find(d => d.day === dayNumber - 1) : null;
  const nextDay = dayNumber < totalDays ? days.find(d => d.day === dayNumber + 1) : null;

  const lockStatus = getRoadmapDayLockStatus(dayNumber, days, progress ?? []);
  const isCompleted = lockStatus.isCompleted;
  const isLocked = lockStatus.isLocked;

  // Mark as in_progress if not started and not locked
  if (currentProgress?.status === "not_started" && !isLocked) {
    await supabase
      .from("roadmap_progress")
      .update({ status: "in_progress" })
      .eq("user_id", user.id)
      .eq("day", dayNumber);
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/roadmap" 
          className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Roadmap
        </Link>
        <span className="text-sm text-slate-500">
          Week {currentDay?.week ?? Math.ceil(dayNumber / 7)} • Day {dayNumber} of {totalDays}
        </span>
      </div>

      {/* Header */}
      <div className="mt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-brand-100 text-brand-700"
              }`}>
                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : dayNumber}
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-700">
                  {plan?.roadmap?.title ?? "Learning Journey"}
                </p>
                <h1 className="text-2xl font-black sm:text-3xl">{currentDay?.title ?? `Day ${dayNumber}`}</h1>
              </div>
            </div>
          </div>
          {isCompleted && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
              Completed ✓
            </span>
          )}
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
          {currentDay?.estimated_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {currentDay.estimated_time}
            </span>
          )}
          {currentDay?.difficulty && (
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {currentDay.difficulty}
            </span>
          )}
          {currentDay?.skills_gained && currentDay.skills_gained.length > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {currentDay.skills_gained.length} skills
            </span>
          )}
        </div>

        {/* Skills Gained */}
        {currentDay?.skills_gained && currentDay.skills_gained.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentDay.skills_gained.map((skill, i) => (
              <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Locked Day Alert Banner */}
        {isLocked && (
          <div className="mt-6 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/60 p-6 shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:to-orange-950/20">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/60 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                    <Clock className="h-3 w-3" /> Day Locked
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-amber-950 dark:text-amber-100">
                    {lockStatus.lockReason}
                  </h3>
                  <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/80">
                    {lockStatus.isDailyResetLock
                      ? "In 24 hours you can only complete 1 day. This day unlocks automatically after the 12:00 AM daily reset to ensure proper pacing and better skill retention."
                      : `You must finish Day ${dayNumber - 1} before unlocking Day ${dayNumber}. Complete each day sequentially to stay on track.`}
                  </p>
                </div>
              </div>
              <Link
                href={`/roadmap/day/${Math.max(1, dayNumber - 1)}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                Go to Day {Math.max(1, dayNumber - 1)} →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Expected Outcome */}
      {currentDay?.expected_outcome && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Expected Outcome</p>
          <p className="mt-1 text-emerald-800 dark:text-emerald-200">{currentDay.expected_outcome}</p>
        </div>
      )}

      {/* Objectives */}
      {currentDay?.objectives && currentDay.objectives.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Target className="h-5 w-5 text-brand-600" />
            Learning Objectives
          </h2>
          <ul className="mt-3 space-y-2">
            {currentDay.objectives.map((objective, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                <span className="text-slate-700 dark:text-slate-300">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Topics */}
      {currentDay?.topics && currentDay.topics.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-brand-600" />
            Topics Covered
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {currentDay.topics.map((topic, i) => (
              <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Practical Task */}
      {currentDay?.practical_task && (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-700 dark:text-brand-300">
            <PlayCircle className="h-5 w-5" />
            Practical Task
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">{currentDay.practical_task}</p>
          <Link
            href={`/assessment/task?type=practical_task&day=${dayNumber}`}
            className="btn-secondary mt-3 inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Open AI Assessment
          </Link>
        </div>
      )}

      {/* Mini Project */}
      {currentDay?.mini_project && (
        <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-900 dark:bg-purple-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-purple-700 dark:text-purple-300">
            <ExternalLink className="h-5 w-5" />
            Mini Project
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">{currentDay.mini_project}</p>
          <Link
            href={`/assessment/task?type=mini_project&day=${dayNumber}`}
            className="btn-secondary mt-3 inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Submit Project for AI Review
          </Link>
        </div>
      )}

      {/* Assignment */}
      {currentDay?.assignment && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-amber-700 dark:text-amber-300">
            <FileText className="h-5 w-5" />
            Assignment
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">{currentDay.assignment}</p>
          <Link
            href={`/assessment/task?type=assignment&day=${dayNumber}`}
            className="btn-secondary mt-3 inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Submit Assignment for AI Review
          </Link>
        </div>
      )}

      {/* Resources */}
      {currentDay?.resources && (currentDay.resources.youtube?.length || currentDay.resources.docs?.length) && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Video className="h-5 w-5 text-brand-600" />
            Learning Resources
          </h2>
          
          {currentDay.resources.youtube && currentDay.resources.youtube.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-500">Videos</p>
              <div className="space-y-2">
                {currentDay.resources.youtube.map((video, i) => (
                  <a
                    key={i}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition-all hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-brand-950/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <Video className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm text-slate-500">{video.channel}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {currentDay.resources.docs && currentDay.resources.docs.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-500">Documentation</p>
              <div className="space-y-2">
                {currentDay.resources.docs.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition-all hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-brand-950/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-slate-500">Official Documentation</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Article Link */}
      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/20">
        <h2 className="flex items-center gap-2 text-lg font-bold text-violet-700 dark:text-violet-300">
          <BookOpen className="h-5 w-5" />
          Detailed Article for This Day
        </h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          Read the full 500-600 word article covering theory, real-world application, common pitfalls, and assessment notes.
        </p>
        <Link
          href={`/articles/${getArticleSlug(plan?.roadmap?.role, plan?.roadmap?.level, dayNumber)}`}
          className="btn-primary mt-3 inline-flex items-center gap-2"
        >
          Read Detailed Article <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      {/* Quiz Notice */}
      {currentDay?.has_quiz && (
        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-indigo-700 dark:text-indigo-300">
            <CheckCircle2 className="h-5 w-5" />
            Quiz Available
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            Test your knowledge with the quiz at the end of this day&apos;s learning.
          </p>
          <Link href={`/quiz/${dayNumber}`} className="btn-primary mt-3">
            Take Quiz
          </Link>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
        {prevDay ? (
          <Link 
            href={`/roadmap/day/${prevDay.day}`}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition-all hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-brand-950/20"
          >
            <ChevronLeft className="h-4 w-4" />
            Day {prevDay.day}: {prevDay.title}
          </Link>
        ) : (
          <div />
        )}
        
        <div className="flex gap-2">
          {!isCompleted && !isLocked && (
            <form action={async () => {
              "use server";
              const supabase = await createServerSupabaseClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const now = new Date();
                await supabase
                  .from("roadmap_progress")
                  .update({ status: "completed", completed_at: now.toISOString() })
                  .eq("user_id", user.id)
                  .eq("day", dayNumber);

                if (dayNumber < totalDays) {
                  const nextMidnight = getNextMidnightUTC(now);
                  await supabase
                    .from("roadmap_progress")
                    .update({
                      status: "locked",
                      unlock_at: nextMidnight.toISOString(),
                    })
                    .eq("user_id", user.id)
                    .eq("day", dayNumber + 1)
                    .neq("status", "completed");
                }
              }
            }}>
              <button type="submit" className="btn-primary">
                Mark Complete ✓
              </button>
            </form>
          )}

          {isLocked && (
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-amber-300/80 bg-amber-100/90 px-4 py-2.5 text-sm font-bold text-amber-900 opacity-90 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
            >
              <Lock className="h-4 w-4" />
              {lockStatus.isDailyResetLock ? "Unlocks after 12 AM reset" : `Complete Day ${dayNumber - 1} to Unlock`}
            </button>
          )}
          
          {nextDay && (
            <Link 
              href={`/roadmap/day/${nextDay.day}`}
              className="btn-secondary flex items-center gap-2"
            >
              Next: Day {nextDay.day}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
