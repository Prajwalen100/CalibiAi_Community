import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { isLearningRole } from "@/lib/learning/content";
import { getRoadmapDayAccess } from "@/lib/learning/day-access";
import { recalculateAndPersistScore } from "@/lib/score/recalculate";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  day: z.number().int().min(1).max(45),
  score: z.number().min(0).max(100),
  totalQuestions: z.number().int().min(1).max(200).optional(),
  correctAnswers: z.number().int().min(0).max(200).optional(),
});

/**
 * Idempotent quiz-submit endpoint. Once a (user_roadmap_id, day) row
 * exists in `roadmap_quiz_completions`, further calls return the stored
 * score instead of recording a new attempt. This is what powers the
 * "Quiz submitted — view score" state on the day page.
 */
export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid quiz payload." },
      { status: 422 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const access = await getStudentAccess(supabase, user.id);
  if (!access.canAccessStudentArea) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const role = access.profile?.learning_role;
  if (!isLearningRole(role)) {
    return NextResponse.json({ error: "Learning role missing." }, { status: 409 });
  }

  const { data: assignment } = await supabase
    .from("user_roadmaps")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", role)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: "No active roadmap." }, { status: 409 });
  }

  const dayAccess = await getRoadmapDayAccess(supabase, user.id, parsed.data.day);
  if (dayAccess.isLocked) {
    return NextResponse.json(
      { error: `Day ${parsed.data.day} is locked.` },
      { status: 403 }
    );
  }

  // Reject re-submission at the API layer. The UI hides the quiz link
  // once the row exists, but the server enforces the rule independently.
  const { data: existing } = await supabase
    .from("roadmap_quiz_completions")
    .select("id,best_score,submitted_at")
    .eq("user_roadmap_id", assignment.id)
    .eq("day", parsed.data.day)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: {
          message: "This quiz was already submitted for this day.",
          code: "already_submitted",
          submittedAt: existing.submitted_at,
          bestScore: existing.best_score,
        },
      },
      { status: 409 }
    );
  }

  const scoreRounded = Math.round(parsed.data.score);
  const { error: insertError } = await supabase.from("roadmap_quiz_completions").insert({
    user_id: user.id,
    user_roadmap_id: assignment.id,
    day: parsed.data.day,
    best_score: scoreRounded,
    total_questions: parsed.data.totalQuestions ?? 0,
    correct_answers: parsed.data.correctAnswers ?? 0,
  });

  if (insertError) {
    // Handle a race where two tabs submit at the same time — the
    // unique index will fire and we simply treat it as "already submitted".
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: { message: "This quiz was already submitted.", code: "already_submitted" } },
        { status: 409 }
      );
    }
    console.error("Quiz submission failed", insertError);
    return NextResponse.json({ error: "Could not save quiz." }, { status: 500 });
  }

  // Roll the quiz score into the CalibiAI pillar total using the shared
  // recalculator, and log the activity for the profile timeline.
  await recalculateAndPersistScore(user.id, { quizAverage: scoreRounded });
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "roadmap_quiz_completed",
    metadata: { day: parsed.data.day, score: scoreRounded },
  });

  return NextResponse.json({ success: true, bestScore: scoreRounded });
}
