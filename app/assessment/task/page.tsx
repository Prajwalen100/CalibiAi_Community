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

export const dynamic = "force-dynamic";

export default async function TaskAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; day?: string }>;
}) {
  const params = await searchParams;
  const taskType = ROADMAP_TASK_TYPES.includes(params.type as RoadmapTaskType)
    ? (params.type as RoadmapTaskType)
    : "practical_task";
  const dayNumber = Number(params.day);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 45) notFound();

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

  const { data: assignment, error: assignmentError } = await supabase
    .from("user_roadmaps")
    .select("id,level")
    .eq("user_id", user.id)
    .eq("role", role)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError || !assignment) redirect("/roadmap/assign");
  if (assignment.level !== "beginner" && assignment.level !== "intermediate") {
    redirect("/roadmap/assign");
  }

  // Tasks belong to a day — if that day is locked, the lab stays closed too.
  const dayAccess = await getRoadmapDayAccess(supabase, user.id, dayNumber);
  if (!dayAccess.hasRoadmap) redirect("/roadmap/assign");
  if (dayAccess.isLocked) redirect(`/roadmap/day/${dayNumber}`);

  let task: ReturnType<typeof getRoadmapTask> = null;
  try {
    task = getRoadmapTask(role, assignment.level, dayNumber, taskType);
  } catch (error) {
    console.error(`Invalid roadmap task for ${role}/${assignment.level}/day-${dayNumber}`, error);
  }
  if (!task) notFound();

  // Hydrate the lab with any prior graded submission so a returning
  // student sees the read-only AI feedback immediately instead of a
  // blank editor. The lab component uses `alreadySubmitted` to hide
  // the Submit + Run AI Checks buttons and prevent another LLM call.
  const { data: priorAward } = await supabase
    .from("roadmap_task_awards")
    .select("submitted,latest_assessment_id")
    .eq("user_roadmap_id", assignment.id)
    .eq("day", dayNumber)
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
            href={`/roadmap/day/${dayNumber}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Day {dayNumber}
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
