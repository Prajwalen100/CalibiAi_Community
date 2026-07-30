import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { getStudentAccess } from "@/lib/auth/student-access";
import { isLearningRole } from "@/lib/learning/content";
import { getRoadmapDayAccess } from "@/lib/learning/day-access";
import { getRoadmapQuiz } from "@/lib/learning/roadmap-quiz";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QuizPageClient } from "./quiz-page-client";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: dayParam } = await params;
  const dayNumber = Number(dayParam);
  if (!Number.isInteger(dayNumber) || dayNumber < 1) notFound();

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

  // The generated dashboard plan intentionally stores only `has_quiz`. Quiz
  // questions remain in the immutable role/level curriculum. Resolve the
  // active assignment, then load and validate that source content directly.
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

  // A locked day's quiz must not be reachable by URL. Send the student back to
  // the day page, which explains why it is locked and what to do next.
  const dayAccess = await getRoadmapDayAccess(supabase, user.id, dayNumber);
  if (!dayAccess.hasRoadmap) redirect("/roadmap/assign");
  if (dayAccess.isLocked) redirect(`/roadmap/day/${dayNumber}`);

  // If this day's quiz was already submitted, do not re-open it. The day
  // page renders the recorded score in read-only mode and any further
  // attempt would just be a wasted round trip.
  const { data: existingQuiz } = await supabase
    .from("roadmap_quiz_completions")
    .select("id")
    .eq("user_roadmap_id", assignment.id)
    .eq("day", dayNumber)
    .maybeSingle();
  if (existingQuiz) redirect(`/roadmap/day/${dayNumber}`);

  let quiz: ReturnType<typeof getRoadmapQuiz> = null;
  try {
    quiz = getRoadmapQuiz(role, assignment.level, dayNumber);
  } catch (error) {
    console.error(`Invalid roadmap quiz for ${role}/${assignment.level}/day-${dayNumber}`, error);
  }

  if (!quiz) notFound();

  return (
    <QuizPageClient
      dayNumber={quiz.dayNumber}
      dayTitle={quiz.dayTitle}
      questions={quiz.questions}
      attemptSeed={randomUUID()}
    />
  );
}
