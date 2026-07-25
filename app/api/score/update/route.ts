import { NextResponse } from "next/server";
import { calculateCalibiAiScore, tierFor } from "@/lib/score/calculate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isOptionalPercentage(value: unknown): value is number | undefined {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { readingScore, quizAverage, quizDay } = body;

    if (!isOptionalPercentage(readingScore) || !isOptionalPercentage(quizAverage)) {
      return NextResponse.json(
        { error: "Reading and quiz scores must be between 0 and 100." },
        { status: 422 }
      );
    }
    if (
      quizDay !== undefined &&
      (!Number.isInteger(quizDay) || (quizDay as number) < 1 || (quizDay as number) > 45)
    ) {
      return NextResponse.json({ error: "Invalid roadmap quiz day." }, { status: 422 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Never accept a user ID from the client. All score reads and writes are
    // scoped to the authenticated user and protected by scores RLS policies.
    const [projectsResult, skillsResult, progressResult, currentScoreResult] =
      await Promise.all([
        supabase
          .from("projects")
          .select("verified,points_awarded,originality_status")
          .eq("user_id", user.id),
        supabase
          .from("user_skills")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("verified", true),
        supabase
          .from("roadmap_progress")
          .select("status")
          .eq("user_id", user.id),
        supabase
          .from("scores")
          .select("community_pts,completion_pts,recognition_pts,reading_pts,quizzes_pts")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    const sourceError =
      projectsResult.error ??
      skillsResult.error ??
      progressResult.error ??
      currentScoreResult.error;
    if (sourceError) {
      console.error("Score inputs unavailable:", sourceError);
      return NextResponse.json(
        { error: "Score tracking is unavailable. Apply the latest database migrations." },
        { status: 500 }
      );
    }

    const progress = progressResult.data ?? [];
    const completedModules = progress.filter((item) => item.status === "completed").length;
    const totalModules = Math.max(progress.length, 1);
    const currentScore = currentScoreResult.data;

    const calculated = calculateCalibiAiScore({
      projects: (projectsResult.data ?? []).map((project) => ({
        verified: project.verified,
        pointsAwarded: project.points_awarded,
        originalityStatus: project.originality_status,
      })),
      verifiedSkillsCount: skillsResult.count ?? 0,
      completedModulesCount: completedModules,
      totalModulesCount: totalModules,
      communityRawPoints: currentScore?.community_pts ?? 0,
      recognitionRawPoints: currentScore?.recognition_pts ?? 0,
      readingScore:
        typeof readingScore === "number" ? readingScore : (currentScore?.reading_pts ?? 0),
      quizAverage:
        typeof quizAverage === "number" ? quizAverage : (currentScore?.quizzes_pts ?? 0),
      lastActivityAt: new Date(),
      now: new Date(),
    });
    // AI Lab awards live in the completion pillar. Other score recalculations
    // must never erase points already earned by a verified lab submission.
    const completionPoints = Math.max(
      calculated.completion_pts,
      currentScore?.completion_pts ?? 0
    );
    const total = Math.min(
      1000,
      calculated.total - calculated.completion_pts + completionPoints
    );
    const breakdown = {
      ...calculated,
      completion_pts: completionPoints,
      total,
      tier: tierFor(total),
    };

    const { error: scoreError } = await supabase.from("scores").upsert(
      {
        user_id: user.id,
        projects_pts: breakdown.projects_pts,
        skills_pts: breakdown.skills_pts,
        community_pts: breakdown.community_pts,
        completion_pts: breakdown.completion_pts,
        recognition_pts: breakdown.recognition_pts,
        reading_pts: breakdown.reading_pts,
        quizzes_pts: breakdown.quizzes_pts,
        total: breakdown.total,
        tier: breakdown.tier,
        last_calculated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (scoreError) {
      console.error("Score update failed:", scoreError);
      return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
    }

    if (typeof quizAverage === "number") {
      // Score persistence must not fail just because activity logging is
      // temporarily unavailable.
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "roadmap_quiz_completed",
        metadata: {
          day: typeof quizDay === "number" ? quizDay : null,
          score: quizAverage,
        },
      });
    }

    return NextResponse.json({ success: true, total: breakdown.total, breakdown });
  } catch (error) {
    console.error("Score update error:", error);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
