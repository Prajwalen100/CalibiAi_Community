"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { reviewProject } from "@/lib/ai/bedrock";
import { calculateCalibiAiScore } from "@/lib/score/calculate";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ProjectSubmitSchema = z.object({
  title: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().min(20, "Please provide a description of at least 20 characters"),
  how_it_works: z.string().min(20, "Please explain how your project works (at least 20 characters)"),
  repo_url: z.string().url("Enter a valid URL").or(z.literal("")),
  live_url: z.string().url("Enter a valid URL").or(z.literal("")),
  module_id: z.string().optional(),
  tech_stack: z.string().optional(),
});

export async function submitProject(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = ProjectSubmitSchema.parse(raw);

  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/");

  // Run AI review via Amazon Bedrock
  const review = await reviewProject({
    title: parsed.title,
    description: parsed.description,
    howItWorks: parsed.how_it_works,
    repoUrl: parsed.repo_url || undefined,
    liveUrl: parsed.live_url || undefined,
  });

  // Calculate points based on review score (scale 0-400 for score weight)
  const pointsAwarded = Math.round(review.score * 4);

  // Map string complexity_tier to the format the DB expects
  // After migration: text column storing "beginner"/"intermediate"/"advanced"
  // Before migration: integer column 1-5 (fallback)
  const complexityTier = review.complexity_tier;

  // Insert the project using server client (user owns their projects)
  const { error: insertError } = await supabase.from("projects").insert({
    user_id: user.id,
    title: parsed.title,
    description: parsed.description,
    how_it_works: parsed.how_it_works,
    repo_url: parsed.repo_url || null,
    live_url: parsed.live_url || null,
    tech_stack: parsed.tech_stack || null,
    module_id: parsed.module_id || null,
    complexity_tier: complexityTier,
    originality_status: review.originality_status,
    points_awarded: pointsAwarded,
    verified: review.score >= 50,
    ai_feedback: review.feedback,
    ai_strengths: review.strengths,
    ai_improvements: review.improvements,
    ai_score: review.score,
  });

  if (insertError) {
    console.error("Project insert error:", insertError);
    // If complexity_tier integer constraint fails, retry with integer value
    if (insertError.message?.includes("complexity_tier")) {
      const tierToInt: Record<string, number> = { beginner: 1, intermediate: 3, advanced: 5 };
      const intTier = tierToInt[complexityTier] ?? 1;
      const { error: retryError } = await supabase.from("projects").insert({
        user_id: user.id,
        title: parsed.title,
        description: parsed.description,
        how_it_works: parsed.how_it_works,
        repo_url: parsed.repo_url || null,
        live_url: parsed.live_url || null,
        tech_stack: parsed.tech_stack || null,
        module_id: parsed.module_id || null,
        complexity_tier: intTier,
        originality_status: review.originality_status,
        points_awarded: pointsAwarded,
        verified: review.score >= 50,
        ai_feedback: review.feedback,
        ai_strengths: review.strengths,
        ai_improvements: review.improvements,
        ai_score: review.score,
      });
      if (retryError) {
        console.error("Project insert retry error:", retryError);
      }
    }
  }

  // Recalculate the user's overall score using admin client
  // (admin client bypasses RLS so score update always works)
  const adminSupabase = createAdminSupabaseClient();

  const { data: allProjects } = await adminSupabase
    .from("projects")
    .select("verified, points_awarded, originality_status")
    .eq("user_id", user.id);

  const { count: verifiedSkillsCount } = await adminSupabase
    .from("user_skills")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("verified", true);

  const { data: roadmapRow } = await adminSupabase
    .from("roadmaps")
    .select("generated_plan")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const modules = (roadmapRow?.generated_plan as { modules?: Array<{ id: string }> })?.modules ?? [];
  const completedModules = modules.length > 0
    ? (await adminSupabase.from("projects").select("module_id", { count: "exact", head: true }).eq("user_id", user.id).eq("verified", true).not("module_id", "is", null)).count ?? 0
    : 0;

  const breakdown = calculateCalibiAiScore({
    projects: (allProjects ?? []).map((p) => ({
      verified: p.verified,
      pointsAwarded: p.points_awarded,
      originalityStatus: p.originality_status,
    })),
    verifiedSkillsCount: verifiedSkillsCount ?? 0,
    completedModulesCount: completedModules,
    totalModulesCount: modules.length,
    communityRawPoints: 0,
    recognitionRawPoints: 0,
    now: new Date(),
  });

  // Use admin client to ensure score update always succeeds
  await adminSupabase
    .from("scores")
    .upsert(
      {
        user_id: user.id,
        projects_pts: breakdown.projects_pts,
        skills_pts: breakdown.skills_pts,
        community_pts: breakdown.community_pts,
        completion_pts: breakdown.completion_pts,
        recognition_pts: breakdown.recognition_pts,
        total: breakdown.total,
        tier: breakdown.tier,
        last_calculated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  redirect("/dashboard?submitted=1");
}
