import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateCalibiAiScore } from "@/lib/score/calculate";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, readingScore, quizAverage } = body;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminSupabase = createAdminSupabaseClient();
    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get existing projects, skills, progress
    const { data: allProjects } = await adminSupabase
      .from("projects")
      .select("verified, points_awarded, originality_status")
      .eq("user_id", targetUserId);

    const { count: verifiedSkillsCount } = await adminSupabase
      .from("user_skills")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("verified", true);

    const { data: progress } = await adminSupabase
      .from("roadmap_progress")
      .select("status")
      .eq("user_id", targetUserId);

    const completedModules = progress?.filter(p => p.status === "completed")?.length ?? 0;
    const totalModules = progress?.length ?? 1;

    const breakdown = calculateCalibiAiScore({
      projects: (allProjects ?? []).map(p => ({
        verified: p.verified,
        pointsAwarded: p.points_awarded,
        originalityStatus: p.originality_status,
      })),
      verifiedSkillsCount: verifiedSkillsCount ?? 0,
      completedModulesCount: completedModules,
      totalModulesCount: totalModules,
      communityRawPoints: 0,
      recognitionRawPoints: 0,
      readingScore: readingScore ?? 0,
      quizAverage: quizAverage ?? 0,
      now: new Date(),
    });

    await adminSupabase
      .from("scores")
      .upsert({
        user_id: targetUserId,
        projects_pts: breakdown.projects_pts,
        skills_pts: breakdown.skills_pts,
        community_pts: breakdown.community_pts,
        completion_pts: breakdown.completion_pts,
        recognition_pts: breakdown.recognition_pts,
        total: breakdown.total,
        tier: breakdown.tier,
        last_calculated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    return NextResponse.json({ success: true, total: breakdown.total, breakdown });
  } catch (err) {
    console.error("Score update error:", err);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
