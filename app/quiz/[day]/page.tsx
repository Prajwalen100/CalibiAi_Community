import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { getStudentAccess } from "@/lib/auth/student-access";
import { isLearningRole } from "@/lib/learning/content";
import { getRoadmapDayAccess } from "@/lib/learning/day-access";
import { getRoadmapQuiz } from "@/lib/learning/roadmap-quiz";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QuizPageClient } from "./quiz-page-client";
import { getRoadmapContext } from "@/lib/roadmap/service";
import { loadRoadmap } from "@/lib/roadmap/loader";
import type { RoadmapStage } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ overall?: string }>;
}) {
  const { day: dayParam } = await params;
  const { overall: overallParam } = await searchParams;

  const rawDay = Number(dayParam);
  const rawOverall = overallParam ? Number(overallParam) : NaN;

  if (!Number.isInteger(rawDay) || rawDay < 1) notFound();

  let stageDayCandidate = rawDay;
  let overallDayCandidate = Number.isInteger(rawOverall) && rawOverall >= 1 ? rawOverall : NaN;
  if (Number.isNaN(overallDayCandidate) && stageDayCandidate > 45) {
    overallDayCandidate = stageDayCandidate;
  }

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
    targetStage = currentStage;
    targetStageDay = stageDayCandidate;
    overallDay = entryStage === "beginner" && targetStage === "intermediate" ? beginnerTotal + targetStageDay : targetStageDay;
  }

  const { data: allAssignments } = await supabase
    .from("user_roadmaps")
    .select("id,level,roadmap_stage")
    .eq("user_id", user.id)
    .eq("role", role)
    .order("stage_index", { ascending: true });

  const targetAssignment = allAssignments?.find((a: any) => a.roadmap_stage === targetStage) as any;
  const activeAssignment = context.assignment;

  const assignmentForCheck = targetAssignment ?? activeAssignment;
  if (!assignmentForCheck) redirect("/roadmap/assign");

  const level = (assignmentForCheck.level ?? targetStage) as RoadmapStage;
  if (level !== "beginner" && level !== "intermediate") redirect("/roadmap/assign");

  // Locked check
  if (targetStage === "intermediate" && entryStage === "beginner" && currentStage === "beginner" && !context.state?.beginnerCompleted) {
    redirect(`/roadmap/day/${overallDay}`);
  }

  const dayAccess = await getRoadmapDayAccess(supabase, user.id, targetStageDay);
  if (!dayAccess.hasRoadmap) redirect("/roadmap/assign");
  if (targetStage === currentStage && dayAccess.isLocked) redirect(`/roadmap/day/${overallDay}`);

  const { data: existingQuiz } = await supabase
    .from("roadmap_quiz_completions")
    .select("id")
    .eq("user_roadmap_id", assignmentForCheck.id)
    .eq("day", targetStageDay)
    .maybeSingle();
  if (existingQuiz) redirect(`/roadmap/day/${overallDay}`);

  let quiz: ReturnType<typeof getRoadmapQuiz> = null;
  try {
    quiz = getRoadmapQuiz(role, targetStage, targetStageDay);
  } catch (error) {
    console.error(`Invalid roadmap quiz for ${role}/${targetStage}/day-${targetStageDay}`, error);
  }

  if (!quiz) notFound();

  return (
    <QuizPageClient
      dayNumber={targetStageDay}
      dayTitle={`${quiz.dayTitle} • Overall ${overallDay} • ${targetStage}`}
      questions={quiz.questions}
      attemptSeed={randomUUID()}
    />
  );
}
