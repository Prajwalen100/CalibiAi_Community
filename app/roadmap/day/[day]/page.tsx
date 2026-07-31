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
import {
  formatUnlockTime,
  getNextMidnightUTC,
  getRoadmapDayLockStatus,
  type RoadmapDayLockStatus,
} from "@/lib/learning/day-lock";
import {
  getRoadmapDayAccess,
  ROADMAP_PROGRESS_LOCK_COLUMNS,
} from "@/lib/learning/day-access";
import { ArticleReadBeacon } from "./article-read-beacon";

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

  const [{ data: roadmap }, { data: progress }] = await Promise.all([
    supabase.from("roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    // `completed_at` / `unlock_at` are required by the pacing rules — selecting
    // only `status` silently disabled the 12 AM daily reset lock.
    supabase.from("roadmap_progress").select(ROADMAP_PROGRESS_LOCK_COLUMNS).eq("user_id", user.id).order("day", { ascending: true }),
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

  // Authoritative server-side lock check. A locked day must never render its
  // lesson content, tasks, quiz or article link — even when the URL is typed
  // directly (e.g. /roadmap/day/5 while Day 4 is still incomplete).
  const lockStatus = getRoadmapDayLockStatus(dayNumber, days, progress ?? []);
  const isCompleted = lockStatus.isCompleted;
  const isLocked = lockStatus.isLocked;

  if (isLocked) {
    return (
      <LockedDayScreen
        dayNumber={dayNumber}
        dayTitle={currentDay?.title}
        totalDays={totalDays}
        lockStatus={lockStatus}
      />
    );
  }

  // Past this point the day is unlocked. Mark it in progress on first open.
  if (currentProgress?.status === "not_started") {
    await supabase
      .from("roadmap_progress")
      .update({ status: "in_progress" })
      .eq("user_id", user.id)
      .eq("day", dayNumber);
  }

  // Resolve the active roadmap assignment so we can look up per-day
  // submission state. This is a cheap query — the (user_id, role,
  // status) index makes it O(1).
  const { data: activeAssignment } = await supabase
    .from("user_roadmaps")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Pull every "done vs. not done" signal for this day in a single hop:
  //   * per-task awards (score + submitted flag)
  //   * quiz completion (score)
  //   * article read
  //
  // The three queries are fired in parallel and default to `null` when
  // the tables have no row yet, so `.maybeSingle()` never throws.
  const [taskAwardsResult, quizResult, articleResult] = await Promise.all([
    activeAssignment
      ? supabase
          .from("roadmap_task_awards")
          .select("task_type,best_score,submitted,submitted_at")
          .eq("user_roadmap_id", activeAssignment.id)
          .eq("day", dayNumber)
      : Promise.resolve({ data: null, error: null } as const),
    activeAssignment
      ? supabase
          .from("roadmap_quiz_completions")
          .select("best_score,submitted_at")
          .eq("user_roadmap_id", activeAssignment.id)
          .eq("day", dayNumber)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
    activeAssignment
      ? supabase
          .from("roadmap_article_reads")
          .select("read_at")
          .eq("user_roadmap_id", activeAssignment.id)
          .eq("day", dayNumber)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
  ]);

  type TaskAwardRow = {
    task_type: "practical_task" | "mini_project" | "assignment";
    best_score: number | null;
    submitted: boolean | null;
    submitted_at: string | null;
  };
  const taskAwards: TaskAwardRow[] = (taskAwardsResult.data as TaskAwardRow[] | null) ?? [];
  const taskState = (taskType: TaskAwardRow["task_type"]) => {
    const row = taskAwards.find((r) => r.task_type === taskType);
    return {
      submitted: Boolean(row?.submitted),
      score: row?.best_score ?? null,
    };
  };
  const practicalState = taskState("practical_task");
  const miniProjectState = taskState("mini_project");
  const assignmentState = taskState("assignment");
  const quizState = {
    submitted: Boolean(quizResult.data),
    score: quizResult.data?.best_score ?? null,
  };
  const articleReadState = { read: Boolean(articleResult.data) };

  // Every present requirement must be satisfied before the day can be
  // marked complete. A day that does not include (say) a mini project
  // simply drops that requirement — the gate stays honest for every
  // shape of day defined in the curriculum.
  const requirements = [
    currentDay?.practical_task ? practicalState.submitted : true,
    currentDay?.mini_project ? miniProjectState.submitted : true,
    currentDay?.assignment ? assignmentState.submitted : true,
    currentDay?.has_quiz ? quizState.submitted : true,
    articleReadState.read, // article link is present on every day
  ];
  const canMarkComplete = requirements.every(Boolean);

  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
        <TaskCard
          kind="practical_task"
          title="Practical Task"
          description={currentDay.practical_task}
          submitted={practicalState.submitted}
          score={practicalState.score}
          dayNumber={dayNumber}
          accent="brand"
        />
      )}

      {/* Mini Project */}
      {currentDay?.mini_project && (
        <TaskCard
          kind="mini_project"
          title="Mini Project"
          description={currentDay.mini_project}
          submitted={miniProjectState.submitted}
          score={miniProjectState.score}
          dayNumber={dayNumber}
          accent="purple"
        />
      )}

      {/* Assignment */}
      {currentDay?.assignment && (
        <TaskCard
          kind="assignment"
          title="Assignment"
          description={currentDay.assignment}
          submitted={assignmentState.submitted}
          score={assignmentState.score}
          dayNumber={dayNumber}
          accent="amber"
        />
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
      <ArticleCard
        articleHref={`/articles/${getArticleSlug(plan?.roadmap?.role, plan?.roadmap?.level, dayNumber)}`}
        dayNumber={dayNumber}
        alreadyRead={articleReadState.read}
      />

      {/* Quiz Notice */}
      {currentDay?.has_quiz && (
        <QuizCard
          dayNumber={dayNumber}
          submitted={quizState.submitted}
          score={quizState.score}
        />
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
        
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          {!isCompleted && (
            <MarkCompleteForm
              dayNumber={dayNumber}
              totalDays={totalDays}
              canMarkComplete={canMarkComplete}
              requirements={{
                practical: currentDay?.practical_task
                  ? practicalState.submitted
                  : null,
                miniProject: currentDay?.mini_project
                  ? miniProjectState.submitted
                  : null,
                assignment: currentDay?.assignment
                  ? assignmentState.submitted
                  : null,
                quiz: currentDay?.has_quiz ? quizState.submitted : null,
                article: articleReadState.read,
              }}
            />
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

// -------------------------------------------------------------------------
// Task / article / quiz cards
// -------------------------------------------------------------------------

const ACCENTS = {
  brand: {
    border: "border-brand-200 dark:border-brand-800",
    background: "bg-brand-50 dark:bg-brand-950/20",
    title: "text-brand-700 dark:text-brand-300",
    icon: PlayCircle,
  },
  purple: {
    border: "border-purple-200 dark:border-purple-900",
    background: "bg-purple-50 dark:bg-purple-950/20",
    title: "text-purple-700 dark:text-purple-300",
    icon: ExternalLink,
  },
  amber: {
    border: "border-amber-200 dark:border-amber-900",
    background: "bg-amber-50 dark:bg-amber-950/20",
    title: "text-amber-700 dark:text-amber-300",
    icon: FileText,
  },
} as const;

type Accent = keyof typeof ACCENTS;

function TaskCard({
  kind,
  title,
  description,
  submitted,
  score,
  dayNumber,
  accent,
}: {
  kind: "practical_task" | "mini_project" | "assignment";
  title: string;
  description: string;
  submitted: boolean;
  score: number | null;
  dayNumber: number;
  accent: Accent;
}) {
  const style = ACCENTS[accent];
  const Icon = style.icon;
  return (
    <div
      className={`mt-4 rounded-2xl border p-5 ${
        submitted
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
          : `${style.border} ${style.background}`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          className={`flex items-center gap-2 text-lg font-bold ${
            submitted ? "text-emerald-700 dark:text-emerald-300" : style.title
          }`}
        >
          <Icon className="h-5 w-5" />
          {title}
        </h2>
        {submitted && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Submitted{typeof score === "number" ? ` • ${score}/100` : ""}
          </span>
        )}
      </div>
      <p className="mt-2 text-slate-700 dark:text-slate-300">{description}</p>

      {submitted ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/assessment/task?type=${kind}&day=${dayNumber}`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> View AI Review
          </Link>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            You can only submit this once — resubmission is disabled.
          </span>
        </div>
      ) : (
        <Link
          href={`/assessment/task?type=${kind}&day=${dayNumber}`}
          className="btn-secondary mt-3 inline-flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {kind === "practical_task"
            ? "Open AI Assessment"
            : kind === "mini_project"
              ? "Submit Project for AI Review"
              : "Submit Assignment for AI Review"}
        </Link>
      )}
    </div>
  );
}

function ArticleCard({
  articleHref,
  dayNumber,
  alreadyRead,
}: {
  articleHref: string;
  dayNumber: number;
  alreadyRead: boolean;
}) {
  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${
        alreadyRead
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          className={`flex items-center gap-2 text-lg font-bold ${
            alreadyRead
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-violet-700 dark:text-violet-300"
          }`}
        >
          <BookOpen className="h-5 w-5" />
          Detailed Article for This Day
        </h2>
        {alreadyRead && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Read
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
        Read the full 500-600 word article covering theory, real-world application, common pitfalls, and assessment notes.
      </p>
      <ArticleReadLink
        articleHref={articleHref}
        dayNumber={dayNumber}
        alreadyRead={alreadyRead}
      />
    </div>
  );
}

function QuizCard({
  dayNumber,
  submitted,
  score,
}: {
  dayNumber: number;
  submitted: boolean;
  score: number | null;
}) {
  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${
        submitted
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          className={`flex items-center gap-2 text-lg font-bold ${
            submitted
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-indigo-700 dark:text-indigo-300"
          }`}
        >
          <CheckCircle2 className="h-5 w-5" />
          {submitted ? "Quiz Completed" : "Quiz Available"}
        </h2>
        {submitted && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow-sm">
            Score {typeof score === "number" ? `${score}/100` : "saved"}
          </span>
        )}
      </div>
      <p className="mt-2 text-slate-700 dark:text-slate-300">
        {submitted
          ? "Your quiz score is locked in for this day. Retakes are disabled to keep the leaderboard fair."
          : "Test your knowledge with the quiz at the end of this day's learning."}
      </p>
      {!submitted && (
        <Link href={`/quiz/${dayNumber}`} className="btn-primary mt-3">
          Take Quiz
        </Link>
      )}
    </div>
  );
}

/**
 * The "Read Detailed Article" button also records the read via a small
 * beacon so the day page's Mark Complete gate can flip on. It's a
 * client component because `navigator.sendBeacon` needs the browser —
 * but it degrades gracefully to a normal link if beacons are blocked.
 */
function ArticleReadLink({
  articleHref,
  dayNumber,
  alreadyRead,
}: {
  articleHref: string;
  dayNumber: number;
  alreadyRead: boolean;
}) {
  // We render the same <Link> markup on server and client; the beacon
  // fires from a small client-only helper.
  return (
    <>
      <Link
        href={articleHref}
        className="btn-primary mt-3 inline-flex items-center gap-2"
        data-role="article-read-link"
        data-day={dayNumber}
        prefetch={false}
      >
        {alreadyRead ? "Reopen Detailed Article" : "Read Detailed Article"}{" "}
        <ExternalLink className="h-4 w-4" />
      </Link>
      <ArticleReadBeacon dayNumber={dayNumber} />
    </>
  );
}

// -------------------------------------------------------------------------
// Mark Complete
// -------------------------------------------------------------------------

function MarkCompleteForm({
  dayNumber,
  totalDays,
  canMarkComplete,
  requirements,
}: {
  dayNumber: number;
  totalDays: number;
  canMarkComplete: boolean;
  requirements: {
    practical: boolean | null;
    miniProject: boolean | null;
    assignment: boolean | null;
    quiz: boolean | null;
    article: boolean;
  };
}) {
  const missing: string[] = [];
  if (requirements.practical === false) missing.push("Practical Task");
  if (requirements.miniProject === false) missing.push("Mini Project");
  if (requirements.assignment === false) missing.push("Assignment");
  if (requirements.quiz === false) missing.push("Quiz");
  if (!requirements.article) missing.push("Detailed Article");

  return (
    <form
      className="flex flex-col items-end gap-1"
      action={async () => {
        "use server";
        const supabase = await createServerSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Re-run the gate on the server so a malicious client can't POST
        // this action with the button hidden.
        const access = await getRoadmapDayAccess(supabase, user.id, dayNumber);
        if (access.isLocked) return;

        const gate = await isDayReadyForCompletion(supabase, user.id, dayNumber);
        if (!gate.ready) return;

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
      }}
    >
      <button
        type="submit"
        disabled={!canMarkComplete}
        className={`btn-primary ${
          canMarkComplete
            ? ""
            : "cursor-not-allowed opacity-50 hover:!bg-brand-600"
        }`}
        title={
          canMarkComplete
            ? "Mark this day complete and unlock tomorrow"
            : `Finish: ${missing.join(", ")}`
        }
      >
        Mark Complete ✓
      </button>
      {!canMarkComplete && missing.length > 0 && (
        <p className="max-w-xs text-right text-xs font-semibold text-amber-700 dark:text-amber-400">
          Finish {missing.join(", ")} first.
        </p>
      )}
    </form>
  );
}

/**
 * Server-side re-check of the completion gate. Mirrors the client-side
 * requirement calculation so the "Mark Complete" server action refuses
 * to run when a task, quiz or article read is still missing.
 */
async function isDayReadyForCompletion(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  dayNumber: number,
): Promise<{ ready: boolean; missing: string[] }> {
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("generated_plan")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const plan = roadmap?.generated_plan as StoredRoadmap | undefined;
  const dayDef = plan?.days?.find((d) => d.day === dayNumber);
  if (!dayDef) return { ready: false, missing: ["day"] };

  const { data: activeAssignment } = await supabase
    .from("user_roadmaps")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!activeAssignment) return { ready: false, missing: ["roadmap"] };

  const [awardsRes, quizRes, articleRes] = await Promise.all([
    supabase
      .from("roadmap_task_awards")
      .select("task_type,submitted")
      .eq("user_roadmap_id", activeAssignment.id)
      .eq("day", dayNumber),
    supabase
      .from("roadmap_quiz_completions")
      .select("id")
      .eq("user_roadmap_id", activeAssignment.id)
      .eq("day", dayNumber)
      .maybeSingle(),
    supabase
      .from("roadmap_article_reads")
      .select("id")
      .eq("user_roadmap_id", activeAssignment.id)
      .eq("day", dayNumber)
      .maybeSingle(),
  ]);

  const awards = ((awardsRes.data ?? []) as Array<{
    task_type: string;
    submitted: boolean;
  }>).reduce<Record<string, boolean>>((acc, row) => {
    acc[row.task_type] = row.submitted;
    return acc;
  }, {});

  const missing: string[] = [];
  if (dayDef.practical_task && !awards.practical_task) missing.push("practical_task");
  if (dayDef.mini_project && !awards.mini_project) missing.push("mini_project");
  if (dayDef.assignment && !awards.assignment) missing.push("assignment");
  if (dayDef.has_quiz && !quizRes.data) missing.push("quiz");
  if (!articleRes.data) missing.push("article");
  return { ready: missing.length === 0, missing };
}

/**
 * Full-page replacement shown instead of a locked day's content.
 *
 * This is intentionally a *substitute* for the lesson body rather than a banner
 * on top of it: objectives, topics, tasks, quiz and article links must not be
 * reachable until the previous day is completed and the 12 AM reset has passed.
 */
function LockedDayScreen({
  dayNumber,
  dayTitle,
  totalDays,
  lockStatus,
}: {
  dayNumber: number;
  dayTitle?: string;
  totalDays: number;
  lockStatus: RoadmapDayLockStatus;
}) {
  const previousDay = Math.max(1, dayNumber - 1);
  const isDailyReset = lockStatus.isDailyResetLock;

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/roadmap"
          className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Roadmap
        </Link>
        <span className="text-sm text-slate-500">
          Day {dayNumber} of {totalDays}
        </span>
      </div>

      <div className="mt-6 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-8 text-center shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:to-orange-950/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
          <Lock className="h-8 w-8" />
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-200/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
          <Clock className="h-3 w-3" /> Day {dayNumber} Locked
        </span>

        <h1 className="mt-3 text-2xl font-black text-amber-950 dark:text-amber-100 sm:text-3xl">
          {lockStatus.lockReason ?? `Complete Day ${previousDay} to unlock`}
        </h1>

        {dayTitle && (
          <p className="mt-2 text-sm font-semibold text-amber-800/80 dark:text-amber-200/70">
            Day {dayNumber}: {dayTitle}
          </p>
        )}

        <p className="mx-auto mt-4 max-w-xl text-sm text-amber-900/90 dark:text-amber-100/80">
          {isDailyReset
            ? "You can complete one day every 24 hours. This day unlocks automatically after the 12:00 AM daily reset, which keeps your pacing steady and improves skill retention."
            : `Days must be completed in order. Finish Day ${previousDay} — including its tasks — before Day ${dayNumber} opens.`}
        </p>

        {isDailyReset && lockStatus.unlockAt && (
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Unlocks at {formatUnlockTime(lockStatus.unlockAt)}
          </p>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {!isDailyReset && (
            <Link
              href={`/roadmap/day/${previousDay}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700"
            >
              Go to Day {previousDay} →
            </Link>
          )}
          <Link
            href="/roadmap"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-amber-900 transition-all hover:bg-white dark:border-amber-800 dark:bg-slate-900/60 dark:text-amber-200 dark:hover:bg-slate-900"
          >
            View Full Roadmap
          </Link>
        </div>
      </div>
    </section>
  );
}
