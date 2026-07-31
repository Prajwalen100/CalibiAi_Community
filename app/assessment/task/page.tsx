import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AiTaskLab } from "@/components/ai-task-lab";
import { getStudentAccess } from "@/lib/auth/student-access";
import { isLearningRole } from "@/lib/learning/content";
import { getRoadmapDayAccess } from "@/lib/learning/day-access";
import { getRoadmapTask } from "@/lib/learning/roadmap-task";
import {
  ROADMAP_TASK_TYPES,
  type RoadmapTaskType,
} from "@/lib/learning/task-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRoadmapContext, getStageProgress } from "@/lib/roadmap/service";
import { loadRoadmap } from "@/lib/roadmap/loader";
import type { RoadmapStage } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export default async function TaskAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; day?: string; overall?: string }>;
}) {
  const params = await searchParams;
  const taskType = ROADMAP_TASK_TYPES.includes(params.type as RoadmapTaskType)
    ? (params.type as RoadmapTaskType)
    : "practical_task";

  const rawDay = Number(params.day);
  const rawOverall = params.overall ? Number(params.overall) : NaN;

  // Day param is stage-local day (1-45), overall is overall journey day (1-90) – we support both
  let stageDayCandidate = Number.isInteger(rawDay) && rawDay >= 1 ? rawDay : 1;
  let overallDayCandidate = Number.isInteger(rawOverall) && rawOverall >= 1 ? rawOverall : NaN;

  // For backward compat: if only day is present and it's >45, treat it as overall
  if (Number.isNaN(overallDayCandidate) && stageDayCandidate > 45) {
    overallDayCandidate = stageDayCandidate;
  }

  if (!Number.isInteger(stageDayCandidate) || stageDayCandidate < 1) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  const role = access.profile?.learning_role;
  if (!isLearningRole(role)) redirect("/roadmap/assign");

  let context;
  try {
    context = await getRoadmapContext(supabase, user.id);
  } catch {
    context = null;
  }
  if (!context || !context.hasRoadmap) redirect("/roadmap/assign");

  const entryStage = (context.state?.entryStage ?? context.assignment?.entryStage ?? "beginner") as RoadmapStage;
  const currentStage = (context.state?.currentStage ?? context.assignment?.stage ?? "beginner") as RoadmapStage;

  let beginnerLoaded: ReturnType<typeof loadRoadmap> | null = null;
  let intermediateLoaded: ReturnType<typeof loadRoadmap> | null = null;
  try { beginnerLoaded = loadRoadmap(role, "beginner"); } catch {}
  try { intermediateLoaded = loadRoadmap(role, "intermediate"); } catch {}

  const beginnerTotal = beginnerLoaded?.totalDays ?? 45;
  let targetStage: RoadmapStage;
  let targetStageDay: number;
  let overallDay: number;

  if (!Number.isNaN(overallDayCandidate)) {
    overallDay = overallDayCandidate;
    if (entryStage === "beginner") {
      if (overallDay <= beginnerTotal) {
        targetStage = "beginner";
        targetStageDay = overallDay;
      } else {
        targetStage = "intermediate";
        targetStageDay = overallDay - beginnerTotal;
      }
    } else {
      targetStage = "intermediate";
      targetStageDay = overallDay;
    }
  } else {
    // Only stageDay provided – assume it's for current stage or map via entry logic
    // If stageDay <=45 and we are in intermediate stage, treat as intermediate stage day
    // For beginner entry still in beginner, treat as beginner
    targetStage = currentStage;
    targetStageDay = stageDayCandidate;
    overallDay = entryStage === "beginner" && targetStage === "intermediate" ? beginnerTotal + targetStageDay : targetStageDay;
  }

  if (targetStageDay < 1 || targetStageDay > 45) notFound();

  // Resolve assignment for target stage
  const { data: allAssignments } = await supabase
    .from("user_roadmaps")
    .select("id, roadmap_stage, level")
    .eq("user_id", user.id)
    .eq("role", role)
    .order("stage_index", { ascending: true });

  const targetAssignment = allAssignments?.find((a: any) => a.roadmap_stage === targetStage) as any;
  const assignment = targetAssignment ?? allAssignments?.find((a: any) => a.roadmap_stage === currentStage) as any;

  if (!assignment) redirect("/roadmap/assign");
  if (assignment.level !== "beginner" && assignment.level !== "intermediate" && targetAssignment?.level !== "beginner" && targetAssignment?.level !== "intermediate") {
    redirect("/roadmap/assign");
  }

  // Lock check using target stage progress
  const dayAccess = await getRoadmapDayAccess(supabase, user.id, targetStageDay);
  // For intermediate locked behind beginner, we should redirect to overall day view
  if (targetStage === "intermediate" && entryStage === "beginner" && currentStage === "beginner") {
    const beginnerProgress = targetAssignment?.roadmap_stage === "beginner" ? await getStageProgress(supabase, user.id, targetAssignment.id) : [];
    // Check if beginner completed
    const isBeginnerCompleted = context.state?.beginnerCompleted ?? false;
    if (!isBeginnerCompleted) {
      redirect(`/roadmap/day/${overallDay}`);
    }
  }

  if (!dayAccess.hasRoadmap) redirect("/roadmap/assign");
  // Only enforce lock for current stage days
  if (targetStage === currentStage && dayAccess.isLocked) redirect(`/roadmap/day/${overallDay}`);

  let task: ReturnType<typeof getRoadmapTask> = null;
  try {
    task = getRoadmapTask(role, targetStage, targetStageDay, taskType);
  } catch (error) {
    console.error(`Invalid roadmap task for ${role}/${targetStage}/day-${targetStageDay}`, error);
  }
  if (!task) notFound();

  const targetAssignId = targetAssignment?.id ?? assignment.id;

  const { data: priorAward } = await supabase
    .from("roadmap_task_awards")
    .select("submitted,latest_assessment_id")
    .eq("user_roadmap_id", targetAssignId)
    .eq("day", targetStageDay)
    .eq("task_type", taskType)
    .maybeSingle();
  const alreadySubmitted = Boolean(priorAward?.submitted);
  let savedReview = null as
    | null
    | {
        score: number;
        passed: boolean;
        feedback: string;
        strengths: string[];
        improvements: string[];
        correctnessIssues: string[];
        aiEnriched: boolean;
        motivation?: string;
      };
  if (alreadySubmitted && priorAward?.latest_assessment_id) {
    const { data: assessment } = await supabase
      .from("roadmap_task_assessments")
      .select(
        "score,passed,feedback,strengths,improvements,correctness_issues,ai_enriched"
      )
      .eq("id", priorAward.latest_assessment_id)
      .maybeSingle();
    if (assessment) {
      savedReview = {
        score: assessment.score,
        passed: assessment.passed,
        feedback: assessment.feedback,
        strengths: (assessment.strengths as string[] | null) ?? [],
        improvements: (assessment.improvements as string[] | null) ?? [],
        correctnessIssues: (assessment.correctness_issues as string[] | null) ?? [],
        aiEnriched: assessment.ai_enriched,
        motivation: "Locked-in review — no further attempts allowed.",
      };
    }
  }

  return (
    <main>
      <div className="border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
        <div className="mx-auto max-w-[1600px]">
          <Link
            href={`/roadmap/day/${overallDay}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Day {overallDay} ({targetStage} {targetStageDay})
          </Link>
        </div>
      </div>
      <AiTaskLab
        task={task}
        alreadySubmitted={alreadySubmitted}
        savedReview={savedReview}
      />
    </main>
  );
}
