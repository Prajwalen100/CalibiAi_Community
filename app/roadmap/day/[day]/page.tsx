import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { getArticleSlug } from "@/lib/learning/article-link";
import {
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
  Lock,
} from "lucide-react";
import {
  formatUnlockTime,
  getNextMidnightUTC,
  getRoadmapDayLockStatus,
  getRoadmapDayLockStatuses,
  type RoadmapDayLockStatus,
} from "@/lib/learning/day-lock";
import {
  getRoadmapDayAccess,
  ROADMAP_PROGRESS_LOCK_COLUMNS,
} from "@/lib/learning/day-access";
import { ArticleReadBeacon } from "./article-read-beacon";
import { getRoadmapContext, getStageProgress } from "@/lib/roadmap/service";
import { loadRoadmap } from "@/lib/roadmap/loader";
import type { RoadmapStage } from "@/lib/roadmap/types";

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
  const requestedOverallDay = parseInt(dayParam, 10);

  if (isNaN(requestedOverallDay) || requestedOverallDay < 1) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  // Get journey context (overall days, entry stage, current stage)
  let context;
  try {
    context = await getRoadmapContext(supabase, user.id);
  } catch {
    context = null;
  }

  if (!context || !context.hasRoadmap || !context.role) {
    redirect("/roadmap/assign");
  }

  const journey = context.state;
  const role = context.role;
  const entryStage = (journey?.entryStage ?? context.assignment?.entryStage ?? "beginner") as RoadmapStage;
  const currentStage = (journey?.currentStage ?? context.assignment?.stage ?? "beginner") as RoadmapStage;
  const overallJourneyDays = journey?.overallJourneyDays ?? context.current?.totalDays ?? 45;
  const beginnerCompleted = journey?.beginnerCompleted ?? false;

  // Load both JSONs for role (filesystem) – single source of truth
  let beginnerLoaded: ReturnType<typeof loadRoadmap> | null = null;
  let intermediateLoaded: ReturnType<typeof loadRoadmap> | null = null;
  try {
    beginnerLoaded = loadRoadmap(role, "beginner");
  } catch {}
  try {
    intermediateLoaded = loadRoadmap(role, "intermediate");
  } catch {}

  const beginnerTotal = beginnerLoaded?.totalDays ?? 45;
  const intermediateTotal = intermediateLoaded?.totalDays ?? 45;
  const overallTotal = entryStage === "beginner" ? beginnerTotal + intermediateTotal : intermediateTotal;

  // Validate requested day against overall journey
  if (requestedOverallDay > overallTotal) {
    redirect("/roadmap");
  }

  // Resolve which stage & stage-local day the requested overall day maps to
  let targetStage: RoadmapStage;
  let targetStageDay: number;

  if (entryStage === "beginner") {
    if (requestedOverallDay <= beginnerTotal) {
      targetStage = "beginner";
      targetStageDay = requestedOverallDay;
    } else {
      targetStage = "intermediate";
      targetStageDay = requestedOverallDay - beginnerTotal;
    }
  } else {
    targetStage = "intermediate";
    targetStageDay = requestedOverallDay;
  }

  const targetLoaded = targetStage === "beginner" ? beginnerLoaded : intermediateLoaded;
  if (!targetLoaded) {
    redirect("/roadmap");
  }

  const currentDayDef = targetLoaded.days.find((d) => d.day === targetStageDay);
  if (!currentDayDef) {
    redirect("/roadmap");
  }

  // Fetch all assignments for this role to get per-stage progress IDs
  const { data: allAssignments } = await supabase
    .from("user_roadmaps")
    .select("id, roadmap_stage, stage_index, status")
    .eq("user_id", user.id)
    .eq("role", role)
    .order("stage_index", { ascending: true });

  const beginnerAssign = allAssignments?.find((a: any) => a.roadmap_stage === "beginner");
  const intermediateAssign = allAssignments?.find((a: any) => a.roadmap_stage === "intermediate");
  const targetAssignId = targetStage === "beginner" ? beginnerAssign?.id : intermediateAssign?.id;
  const activeAssignmentId = context.assignment?.id ?? (currentStage === "beginner" ? beginnerAssign?.id : intermediateAssign?.id) ?? null;

  // Progress for target stage
  let targetProgress: any[] = [];
  if (targetAssignId) {
    targetProgress = await getStageProgress(supabase, user.id, targetAssignId);
  } else {
    // fallback to context progress if same as current
    if (targetStage === currentStage) targetProgress = context.progress;
  }

  // Also need current stage progress for gating intermediate when beginner not done
  let beginnerProgressForGate: any[] = [];
  if (beginnerAssign) {
    beginnerProgressForGate = await getStageProgress(supabase, user.id, beginnerAssign.id);
  }

  // Authoritative lock check
  let lockStatus: RoadmapDayLockStatus;

  if (targetStage === "intermediate" && entryStage === "beginner" && currentStage === "beginner" && !beginnerCompleted) {
    // Entire intermediate stage is locked behind beginner completion
    lockStatus = {
      dayNumber: targetStageDay,
      isCompleted: false,
      isLocked: true,
      isCurrent: false,
      status: "locked",
      lockReason: "Complete Beginner stage (all 45 days) to unlock Intermediate",
      unlockAt: null,
      isDailyResetLock: false,
    };
  } else {
    lockStatus = getRoadmapDayLockStatus(targetStageDay, targetLoaded.days, targetProgress);
  }

  const isCompleted = lockStatus.isCompleted;
  const isLocked = lockStatus.isLocked;

  if (isLocked) {
    return (
      <LockedDayScreen
        dayNumber={requestedOverallDay}
        stageDay={targetStageDay}
        stage={targetStage}
        dayTitle={currentDayDef.title}
        totalDays={overallTotal}
        lockStatus={lockStatus}
      />
    );
  }

  // Mark in progress on first open (only for the active stage's target assignment)
  const currentProgressRow = targetProgress?.find((p: any) => p.day === targetStageDay);
  if (currentProgressRow?.status === "not_started" && targetAssignId) {
    await supabase
      .from("roadmap_progress")
      .update({ status: "in_progress" })
      .eq("user_id", user.id)
      .eq("user_roadmap_id", targetAssignId)
      .eq("day", targetStageDay);
  }

  // Resolve assignment for submission state (use target stage)
  const assignmentForAwards = targetAssignId ? { id: targetAssignId } : null;

  const [taskAwardsResult, quizResult, articleResult] = await Promise.all([
    assignmentForAwards
      ? supabase
          .from("roadmap_task_awards")
          .select("task_type,best_score,submitted,submitted_at")
          .eq("user_roadmap_id", assignmentForAwards.id)
          .eq("day", targetStageDay)
      : Promise.resolve({ data: null, error: null } as const),
    assignmentForAwards
      ? supabase
          .from("roadmap_quiz_completions")
          .select("best_score,submitted_at")
          .eq("user_roadmap_id", assignmentForAwards.id)
          .eq("day", targetStageDay)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
    assignmentForAwards
      ? supabase
          .from("roadmap_article_reads")
          .select("read_at")
          .eq("user_roadmap_id", assignmentForAwards.id)
          .eq("day", targetStageDay)
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

  const requirements = [
    currentDayDef?.practical_task ? practicalState.submitted : true,
    currentDayDef?.mini_project ? miniProjectState.submitted : true,
    currentDayDef?.assignment ? assignmentState.submitted : true,
    currentDayDef?.has_quiz ? quizState.submitted : true,
    articleReadState.read,
  ];
  const canMarkComplete = requirements.every(Boolean);

  // Prev / Next in overall day terms
  const prevOverall = requestedOverallDay > 1 ? requestedOverallDay - 1 : null;
  const nextOverall = requestedOverallDay < overallTotal ? requestedOverallDay + 1 : null;

  const prevDayDef = (() => {
    if (!prevOverall) return null;
    if (entryStage === "beginner") {
      if (prevOverall <= beginnerTotal) return beginnerLoaded?.days.find((d) => d.day === prevOverall);
      return intermediateLoaded?.days.find((d) => d.day === prevOverall - beginnerTotal);
    }
    return intermediateLoaded?.days.find((d) => d.day === prevOverall);
  })();

  const nextDayDef = (() => {
    if (!nextOverall) return null;
    if (entryStage === "beginner") {
      if (nextOverall <= beginnerTotal) return beginnerLoaded?.days.find((d) => d.day === nextOverall);
      return intermediateLoaded?.days.find((d) => d.day === nextOverall - beginnerTotal);
    }
    return intermediateLoaded?.days.find((d) => d.day === nextOverall);
  })();

  // For article slug we need role + level (target stage)
  const articleLevel = targetStage;

  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/roadmap" className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700">
          <ChevronLeft className="h-4 w-4" />
          Back to Roadmap
        </Link>
        <span className="text-sm text-slate-500">
          Week {currentDayDef.week ?? Math.ceil(requestedOverallDay / 7)} • Day {requestedOverallDay} of {overallTotal} • {targetStage} {targetStageDay}
        </span>
      </div>

      {/* Header */}
      <div className="mt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black ${
                  isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-brand-100 text-brand-700"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : requestedOverallDay}
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-700">
                  {targetLoaded.roadmap?.title ?? "Learning Journey"} • {targetStage}
                </p>
                <h1 className="text-2xl font-black sm:text-3xl">{currentDayDef?.title ?? `Day ${requestedOverallDay}`}</h1>
              </div>
            </div>
          </div>
          {isCompleted && <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">Completed ✓</span>}
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
          {currentDayDef?.estimated_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {currentDayDef.estimated_time}
            </span>
          )}
          {currentDayDef?.difficulty && (
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {currentDayDef.difficulty}
            </span>
          )}
          {currentDayDef?.skills_gained && currentDayDef.skills_gained.length > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {currentDayDef.skills_gained.length} skills
            </span>
          )}
        </div>

        {/* Skills Gained */}
        {currentDayDef?.skills_gained && currentDayDef.skills_gained.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentDayDef.skills_gained.map((skill, i) => (
              <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expected Outcome */}
      {currentDayDef?.expected_outcome && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Expected Outcome</p>
          <p className="mt-1 text-emerald-800 dark:text-emerald-200">{currentDayDef.expected_outcome}</p>
        </div>
      )}

      {/* Objectives */}
      {currentDayDef?.objectives && currentDayDef.objectives.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Target className="h-5 w-5 text-brand-600" />
            Learning Objectives
          </h2>
          <ul className="mt-3 space-y-2">
            {currentDayDef.objectives.map((objective, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                <span className="text-slate-700 dark:text-slate-300">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Topics */}
      {currentDayDef?.topics && currentDayDef.topics.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-brand-600" />
            Topics Covered
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {currentDayDef.topics.map((topic, i) => (
              <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Practical Task */}
      {currentDayDef?.practical_task && (
        <TaskCard
          kind="practical_task"
          title="Practical Task"
          description={currentDayDef.practical_task}
          submitted={practicalState.submitted}
          score={practicalState.score}
          dayNumber={targetStageDay}
          overallDay={requestedOverallDay}
          accent="brand"
        />
      )}

      {/* Mini Project */}
      {currentDayDef?.mini_project && (
        <TaskCard
          kind="mini_project"
          title="Mini Project"
          description={currentDayDef.mini_project}
          submitted={miniProjectState.submitted}
          score={miniProjectState.score}
          dayNumber={targetStageDay}
          overallDay={requestedOverallDay}
          accent="purple"
        />
      )}

      {/* Assignment */}
      {currentDayDef?.assignment && (
        <TaskCard
          kind="assignment"
          title="Assignment"
          description={currentDayDef.assignment}
          submitted={assignmentState.submitted}
          score={assignmentState.score}
          dayNumber={targetStageDay}
          overallDay={requestedOverallDay}
          accent="amber"
        />
      )}

      {/* Resources */}
      {currentDayDef?.resources && (currentDayDef.resources.youtube?.length || currentDayDef.resources.docs?.length) && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Video className="h-5 w-5 text-brand-600" />
            Learning Resources
          </h2>

          {currentDayDef.resources.youtube && currentDayDef.resources.youtube.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-500">Videos</p>
              <div className="space-y-2">
                {currentDayDef.resources.youtube.map((video, i) => (
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

          {currentDayDef.resources.docs && currentDayDef.resources.docs.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-500">Documentation</p>
              <div className="space-y-2">
                {currentDayDef.resources.docs.map((doc, i) => (
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
        articleHref={`/articles/${getArticleSlug(targetLoaded.roadmap?.role, articleLevel, targetStageDay)}`}
        dayNumber={targetStageDay}
        overallDay={requestedOverallDay}
        alreadyRead={articleReadState.read}
      />

      {/* Quiz Notice */}
      {currentDayDef?.has_quiz && <QuizCard dayNumber={targetStageDay} overallDay={requestedOverallDay} submitted={quizState.submitted} score={quizState.score} />}

      {/* Navigation Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
        {prevOverall && prevDayDef ? (
          <Link
            href={`/roadmap/day/${prevOverall}`}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition-all hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-brand-950/20"
          >
            <ChevronLeft className="h-4 w-4" />
            Day {prevOverall}: {prevDayDef.title}
          </Link>
        ) : (
          <div />
        )}

        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          {!isCompleted && (
            <MarkCompleteForm
              overallDay={requestedOverallDay}
              stageDay={targetStageDay}
              stage={targetStage}
              totalDays={overallTotal}
              canMarkComplete={canMarkComplete}
              requirements={{
                practical: currentDayDef?.practical_task ? practicalState.submitted : null,
                miniProject: currentDayDef?.mini_project ? miniProjectState.submitted : null,
                assignment: currentDayDef?.assignment ? assignmentState.submitted : null,
                quiz: currentDayDef?.has_quiz ? quizState.submitted : null,
                article: articleReadState.read,
              }}
            />
          )}

          {nextOverall && nextDayDef && (
            <Link href={`/roadmap/day/${nextOverall}`} className="btn-secondary flex items-center gap-2">
              Next: Day {nextOverall}
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
  overallDay,
  accent,
}: {
  kind: "practical_task" | "mini_project" | "assignment";
  title: string;
  description: string;
  submitted: boolean;
  score: number | null;
  dayNumber: number;
  overallDay: number;
  accent: Accent;
}) {
  const style = ACCENTS[accent];
  const Icon = style.icon;
  return (
    <div
      className={`mt-4 rounded-2xl border p-5 ${
        submitted ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : `${style.border} ${style.background}`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className={`flex items-center gap-2 text-lg font-bold ${submitted ? "text-emerald-700 dark:text-emerald-300" : style.title}`}>
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
          <Link href={`/assessment/task?type=${kind}&day=${dayNumber}&overall=${overallDay}`} className="btn-secondary inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> View AI Review
          </Link>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">You can only submit this once — resubmission is disabled.</span>
        </div>
      ) : (
        <Link href={`/assessment/task?type=${kind}&day=${dayNumber}&overall=${overallDay}`} className="btn-secondary mt-3 inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {kind === "practical_task" ? "Open AI Assessment" : kind === "mini_project" ? "Submit Project for AI Review" : "Submit Assignment for AI Review"}
        </Link>
      )}
    </div>
  );
}

function ArticleCard({
  articleHref,
  dayNumber,
  overallDay,
  alreadyRead,
}: {
  articleHref: string;
  dayNumber: number;
  overallDay: number;
  alreadyRead: boolean;
}) {
  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${
        alreadyRead ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          className={`flex items-center gap-2 text-lg font-bold ${alreadyRead ? "text-emerald-700 dark:text-emerald-300" : "text-violet-700 dark:text-violet-300"}`}
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
      <ArticleReadLink articleHref={articleHref} dayNumber={dayNumber} overallDay={overallDay} alreadyRead={alreadyRead} />
    </div>
  );
}

function QuizCard({
  dayNumber,
  overallDay,
  submitted,
  score,
}: {
  dayNumber: number;
  overallDay: number;
  submitted: boolean;
  score: number | null;
}) {
  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${
        submitted ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className={`flex items-center gap-2 text-lg font-bold ${submitted ? "text-emerald-700 dark:text-emerald-300" : "text-indigo-700 dark:text-indigo-300"}`}>
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
        {submitted ? "Your quiz score is locked in for this day. Retakes are disabled to keep the leaderboard fair." : "Test your knowledge with the quiz at the end of this day's learning."}
      </p>
      {!submitted && (
        <Link href={`/quiz/${dayNumber}?overall=${overallDay}`} className="btn-primary mt-3">
          Take Quiz
        </Link>
      )}
    </div>
  );
}

function ArticleReadLink({
  articleHref,
  dayNumber,
  overallDay,
  alreadyRead,
}: {
  articleHref: string;
  dayNumber: number;
  overallDay: number;
  alreadyRead: boolean;
}) {
  return (
    <>
      <Link href={articleHref} className="btn-primary mt-3 inline-flex items-center gap-2" data-role="article-read-link" data-day={dayNumber} prefetch={false}>
        {alreadyRead ? "Reopen Detailed Article" : "Read Detailed Article"} <ExternalLink className="h-4 w-4" />
      </Link>
      <ArticleReadBeacon dayNumber={dayNumber} />
    </>
  );
}

// -------------------------------------------------------------------------
// Mark Complete
// -------------------------------------------------------------------------

function MarkCompleteForm({
  overallDay,
  stageDay,
  stage,
  totalDays,
  canMarkComplete,
  requirements,
}: {
  overallDay: number;
  stageDay: number;
  stage: RoadmapStage;
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

        // Resolve assignments to get correct user_roadmap_id for this overall day
        const { data: allAssignments } = await supabase
          .from("user_roadmaps")
          .select("id, roadmap_stage")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("stage_index", { ascending: false });

        // For simplicity active stage is used, but we also need to handle stage param
        const active = allAssignments?.[0];
        let targetAssignId: string | null = null;

        if (active) {
          // If requested stage matches active stage, use active id
          // Otherwise try to find matching stage assignment (for history case)
          const { data: all } = await supabase
            .from("user_roadmaps")
            .select("id, roadmap_stage")
            .eq("user_id", user.id)
            .order("stage_index", { ascending: true });
          const match = all?.find((a: any) => a.roadmap_stage === stage) as any;
          targetAssignId = match?.id ?? active.id;
        }

        // Re-run gate using overall day logic – we resolve stageDay already
        const access = await getRoadmapDayAccess(supabase, user.id, stageDay);
        // For overall intermediate locked behind beginner, gate would have shown locked screen, so we should not get here
        if (access.isLocked && stage !== "intermediate") {
          // allow intermediate check to pass if beginner completed? skip
        }

        const gate = await isDayReadyForCompletion(supabase, user.id, stageDay, stage);
        if (!gate.ready) return;

        const now = new Date();

        // Complete this specific stage day
        const completeDay = supabase
          .from("roadmap_progress")
          .update({ status: "completed", completed_at: now.toISOString() })
          .eq("user_id", user.id)
          .eq("day", stageDay);
        await (targetAssignId ? completeDay.eq("user_roadmap_id", targetAssignId) : completeDay);

        // Unlock next day in same stage if any
        // Determine next stage-local day count
        const { data: roadmapRow } = await supabase
          .from("roadmaps")
          .select("generated_plan")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const plan = roadmapRow?.generated_plan as StoredRoadmap | undefined;
        const stageTotal = plan?.totalDays ?? 45;

        // Only unlock if not at end of stage
        if (stageDay < stageTotal) {
          const nextMidnight = getNextMidnightUTC(now);
          const unlockNext = supabase
            .from("roadmap_progress")
            .update({
              status: "locked",
              unlock_at: nextMidnight.toISOString(),
            })
            .eq("user_id", user.id)
            .eq("day", stageDay + 1)
            .neq("status", "completed");
          await (targetAssignId ? unlockNext.eq("user_roadmap_id", targetAssignId) : unlockNext);
        }
      }}
    >
      <button
        type="submit"
        disabled={!canMarkComplete}
        className={`btn-primary ${canMarkComplete ? "" : "cursor-not-allowed opacity-50 hover:!bg-brand-600"}`}
        title={canMarkComplete ? "Mark this day complete and unlock tomorrow" : `Finish: ${missing.join(", ")}`}
      >
        Mark Complete ✓
      </button>
      {!canMarkComplete && missing.length > 0 && (
        <p className="max-w-xs text-right text-xs font-semibold text-amber-700 dark:text-amber-400">Finish {missing.join(", ")} first.</p>
      )}
    </form>
  );
}

async function isDayReadyForCompletion(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  stageDay: number,
  stage: RoadmapStage,
): Promise<{ ready: boolean; missing: string[] }> {
  const { data: roadmap } = await supabase.from("roadmaps").select("generated_plan").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const plan = roadmap?.generated_plan as StoredRoadmap | undefined;
  // For overall journey we need to find day def from filesystem, but plan may only have current stage. Fallback to allow if not found.
  const dayDef = plan?.days?.find((d) => d.day === stageDay);

  const { data: allAssignments } = await supabase.from("user_roadmaps").select("id, roadmap_stage").eq("user_id", userId).order("stage_index", { ascending: true });
  const targetAssign = allAssignments?.find((a: any) => a.roadmap_stage === stage) as any;
  if (!targetAssign) return { ready: false, missing: ["roadmap"] };

  const [awardsRes, quizRes, articleRes] = await Promise.all([
    supabase.from("roadmap_task_awards").select("task_type,submitted").eq("user_roadmap_id", targetAssign.id).eq("day", stageDay),
    supabase.from("roadmap_quiz_completions").select("id").eq("user_roadmap_id", targetAssign.id).eq("day", stageDay).maybeSingle(),
    supabase.from("roadmap_article_reads").select("id").eq("user_roadmap_id", targetAssign.id).eq("day", stageDay).maybeSingle(),
  ]);

  const awards = ((awardsRes.data ?? []) as Array<{ task_type: string; submitted: boolean }>).reduce<Record<string, boolean>>((acc, row) => {
    acc[row.task_type] = row.submitted;
    return acc;
  }, {});

  const missing: string[] = [];
  if (dayDef) {
    if (dayDef.practical_task && !awards.practical_task) missing.push("practical_task");
    if (dayDef.mini_project && !awards.mini_project) missing.push("mini_project");
    if (dayDef.assignment && !awards.assignment) missing.push("assignment");
    if (dayDef.has_quiz && !quizRes.data) missing.push("quiz");
  } else {
    // If we don't have dayDef from stored plan (because it's from other stage), only require article for now? But we still check awards if present in JSON loaded? For safety require at least article
    if (!awards.practical_task && !awards.mini_project && !awards.assignment) {
      // do not block if no tasks in this day? We'll just check quiz/article
    }
    if (!articleRes.data) missing.push("article");
    return { ready: missing.length === 0, missing };
  }
  if (!articleRes.data) missing.push("article");
  return { ready: missing.length === 0, missing };
}

function LockedDayScreen({
  dayNumber,
  stageDay,
  stage,
  dayTitle,
  totalDays,
  lockStatus,
}: {
  dayNumber: number;
  stageDay: number;
  stage: RoadmapStage;
  dayTitle?: string;
  totalDays: number;
  lockStatus: RoadmapDayLockStatus;
}) {
  const previousDay = Math.max(1, dayNumber - 1);
  const isDailyReset = lockStatus.isDailyResetLock;

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between">
        <Link href="/roadmap" className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700">
          <ChevronLeft className="h-4 w-4" />
          Back to Roadmap
        </Link>
        <span className="text-sm text-slate-500">
          Day {dayNumber} of {totalDays} • {stage} {stageDay}
        </span>
      </div>

      <div className="mt-6 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-8 text-center shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:to-orange-950/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
          <Lock className="h-8 w-8" />
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-200/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
          <Clock className="h-3 w-3" /> Day {dayNumber} Locked • {stage}
        </span>

        <h1 className="mt-3 text-2xl font-black text-amber-950 dark:text-amber-100 sm:text-3xl">{lockStatus.lockReason ?? `Complete Day ${previousDay} to unlock`}</h1>

        {dayTitle && (
          <p className="mt-2 text-sm font-semibold text-amber-800/80 dark:text-amber-200/70">
            Day {dayNumber} ({stage} {stageDay}): {dayTitle}
          </p>
        )}

        <p className="mx-auto mt-4 max-w-xl text-sm text-amber-900/90 dark:text-amber-100/80">
          {isDailyReset
            ? "You can complete one day every 24 hours. This day unlocks automatically after the 12:00 AM daily reset, which keeps your pacing steady and improves skill retention."
            : stage === "intermediate"
              ? "This Intermediate day is locked until you finish the entire Beginner stage (45 days). Complete all Beginner days first."
              : `Days must be completed in order. Finish Day ${previousDay} — including its tasks — before Day ${dayNumber} opens.`}
        </p>

        {isDailyReset && lockStatus.unlockAt && (
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">Unlocks at {formatUnlockTime(lockStatus.unlockAt)}</p>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {!isDailyReset && previousDay >= 1 && (
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
