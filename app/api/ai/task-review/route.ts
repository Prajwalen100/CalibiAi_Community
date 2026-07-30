import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewRoadmapTask } from "@/lib/ai/task-assessment";
import { getStudentAccess } from "@/lib/auth/student-access";
import { isLearningRole } from "@/lib/learning/content";
import { getRoadmapTask } from "@/lib/learning/roadmap-task";
import { LAB_LANGUAGES, ROADMAP_TASK_TYPES } from "@/lib/learning/task-types";
import { pointsForTaskScore } from "@/lib/learning/task-scoring";
import { getNextMidnightUTC } from "@/lib/learning/day-lock";
import { getRoadmapDayAccess } from "@/lib/learning/day-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  mode: z.enum(["check", "submit"]).default("submit"),
  taskType: z.enum(ROADMAP_TASK_TYPES),
  dayNumber: z.number().int().min(1).max(45),
  language: z.enum(LAB_LANGUAGES),
  submission: z.string().trim().min(20).max(30_000),
  explanation: z.string().trim().max(8_000).default(""),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

export async function POST(request: Request) {
  try {
    const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ?? "The lab submission is invalid.",
        422
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return errorResponse("Please sign in again.", 401);

    const access = await getStudentAccess(supabase, user.id);
    if (!access.canAccessStudentArea) {
      return errorResponse("Complete onboarding and your placement assessment first.", 403);
    }
    const role = access.profile?.learning_role;
    if (!isLearningRole(role)) {
      return errorResponse("Your learning role could not be resolved.", 409);
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("user_roadmaps")
      .select("id,level")
      .eq("user_id", user.id)
      .eq("role", role)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return errorResponse("Your active roadmap could not be loaded.", 409);
    }
    if (assignment.level !== "beginner" && assignment.level !== "intermediate") {
      return errorResponse("Your roadmap level is invalid.", 409);
    }

    // Reject work submitted for a day the student has not unlocked yet. The UI
    // hides locked days, but the endpoint must enforce it independently.
    const dayAccess = await getRoadmapDayAccess(
      supabase,
      user.id,
      parsed.data.dayNumber
    );
    if (dayAccess.isLocked) {
      return errorResponse(
        dayAccess.lockStatus.isDailyResetLock
          ? "This day is locked until the 12:00 AM daily reset."
          : `Day ${parsed.data.dayNumber} is locked. Complete Day ${parsed.data.dayNumber - 1} first.`,
        403
      );
    }

    const task = getRoadmapTask(
      role,
      assignment.level,
      parsed.data.dayNumber,
      parsed.data.taskType
    );
    if (!task) return errorResponse("This roadmap task was not found.", 404);

    const review = await reviewRoadmapTask({
      task,
      language: parsed.data.language,
      submission: parsed.data.submission,
      explanation: parsed.data.explanation,
    });

    if (parsed.data.mode === "check") {
      return NextResponse.json({
        ...review,
        saved: false,
        pointsEarned: 0,
        bestTaskPoints: 0,
        calibiPointsAdded: 0,
      });
    }

    const potentialPoints = pointsForTaskScore(review.score);
    const { data: priorAward, error: priorAwardError } = await supabase
      .from("roadmap_task_awards")
      .select("id,best_score,points_awarded")
      .eq("user_roadmap_id", assignment.id)
      .eq("day", task.dayNumber)
      .eq("task_type", task.taskType)
      .maybeSingle();

    if (priorAwardError) {
      console.error("Roadmap task award lookup failed", priorAwardError);
      return errorResponse(
        "AI Lab storage is unavailable. Apply the latest Supabase migrations and retry.",
        503
      );
    }

    const priorPoints = priorAward?.points_awarded ?? 0;
    const bestTaskPoints = Math.max(priorPoints, potentialPoints);
    const pointsEarned = bestTaskPoints - priorPoints;

    const { data: assessment, error: assessmentError } = await supabase
      .from("roadmap_task_assessments")
      .insert({
        user_id: user.id,
        user_roadmap_id: assignment.id,
        role,
        level: assignment.level,
        day: task.dayNumber,
        task_type: task.taskType,
        task_description: task.taskDescription,
        submission_language: parsed.data.language,
        submission: parsed.data.submission,
        explanation: parsed.data.explanation,
        score: review.score,
        passed: review.passed,
        points_awarded: pointsEarned,
        feedback: review.feedback,
        strengths: review.strengths,
        improvements: review.improvements,
        correctness_issues: review.correctnessIssues,
        ai_enriched: review.aiEnriched,
      })
      .select("id")
      .single();

    if (assessmentError || !assessment) {
      console.error("Roadmap task assessment save failed", assessmentError);
      return errorResponse("Your review completed, but it could not be saved. Please retry.", 500);
    }

    const bestScore = Math.max(priorAward?.best_score ?? 0, review.score);
    const awardMutation = priorAward
      ? supabase
          .from("roadmap_task_awards")
          .update({
            best_score: bestScore,
            points_awarded: bestTaskPoints,
            latest_assessment_id: assessment.id,
          })
          .eq("id", priorAward.id)
      : supabase.from("roadmap_task_awards").insert({
          user_id: user.id,
          user_roadmap_id: assignment.id,
          day: task.dayNumber,
          task_type: task.taskType,
          best_score: bestScore,
          points_awarded: bestTaskPoints,
          latest_assessment_id: assessment.id,
        });
    const { error: awardError } = await awardMutation;
    if (awardError) {
      console.error("Roadmap task award save failed", awardError);
      return errorResponse("The assessment was saved, but points could not be awarded. Retry once.", 500);
    }

    // The database function locks the award state and score rows together, so
    // retries can neither lose nor double-count points.
    const { data: scoreRows, error: scoreWriteError } = await supabase.rpc(
      "apply_roadmap_lab_points",
      { p_user_id: user.id }
    );
    if (scoreWriteError) {
      console.error("AI Lab score write failed", scoreWriteError);
      return errorResponse("The assessment was saved, but your CalibiAI score could not be updated.", 500);
    }
    const scoreResult = Array.isArray(scoreRows) ? scoreRows[0] : scoreRows;
    const calibiPointsAdded = Number(scoreResult?.points_added ?? 0);
    const total = Number(scoreResult?.total_score ?? 0);

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "roadmap_task_assessed",
      metadata: {
        assessment_id: assessment.id,
        role,
        level: assignment.level,
        day: task.dayNumber,
        task_type: task.taskType,
        score: review.score,
        passed: review.passed,
        points_earned: pointsEarned,
      },
    });

    // Auto-complete roadmap day for any passed task (mini_project, practical_task, assignment, quiz)
    const autoCompleteTypes = ["mini_project", "practical_task", "assignment", "quiz"];
    if (autoCompleteTypes.includes(parsed.data.taskType) && review.passed) {
      const now = new Date();
      // `roadmap_progress` is unique on (user_id, module_id) and
      // (user_roadmap_id, day) — there is no (user_id, day) constraint, so an
      // upsert on that pair fails. Update the existing row for this day
      // instead; it is always seeded when the roadmap is assigned.
      await supabase
        .from("roadmap_progress")
        .update({ status: "completed", completed_at: now.toISOString() })
        .eq("user_id", user.id)
        .eq("day", task.dayNumber);

      // Arm the 12 AM pacing lock on the next day so it cannot be opened today.
      await supabase
        .from("roadmap_progress")
        .update({
          status: "locked",
          unlock_at: getNextMidnightUTC(now).toISOString(),
        })
        .eq("user_id", user.id)
        .eq("day", task.dayNumber + 1)
        .neq("status", "completed");
    }

    return NextResponse.json({
      ...review,
      saved: true,
      assessmentId: assessment.id,
      pointsEarned,
      bestTaskPoints,
      calibiPointsAdded,
      calibiScore: total,
    });
  } catch (error) {
    console.error("Task review error", error);
    return errorResponse("The AI Lab could not review this submission. Please retry.", 500);
  }
}
