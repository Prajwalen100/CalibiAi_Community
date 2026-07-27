"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { reviewProject } from "@/lib/ai/bedrock";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recalculateAndPersistScore } from "@/lib/score/recalculate";

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

  // Run AI review via CalibiAI Assistant
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

  // Recalculate the user's overall Talent Score from live data (admin client
  // bypasses RLS so it always succeeds, and it's the same logic used
  // everywhere else the score updates: community activity, quiz/reading
  // tracking, and the self-healing recompute on the public profile page).
  await recalculateAndPersistScore(user.id);

  redirect("/dashboard?submitted=1");
}
