import { redirect } from "next/navigation";
import { AssigningRoadmap } from "./assigning-roadmap";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { resolveStageForScore } from "@/lib/roadmap/engine";
import { roadmapTotalDays } from "@/lib/roadmap/loader";
import { resolvePlacementThreshold } from "@/lib/roadmap/settings";
import { isLearningRole } from "@/lib/learning/content";

export const dynamic = "force-dynamic";

export default async function AssignRoadmapPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.hasCompletedAssessment) redirect(access.nextPath);

  // Check if user already has a roadmap assigned
  const { data: existingRoadmap } = await supabase
    .from("roadmaps")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // If user already has a roadmap, redirect to dashboard
  if (existingRoadmap) {
    redirect("/dashboard");
  }

  // Determine the expected journey length so the loading screen can show the correct day count
  let expectedJourneyDays = 90; // default to full journey
  try {
    const [{ data: profile }, { data: assessment }] = await Promise.all([
      supabase.from("profiles").select("learning_role,roadmap_stage_override").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("assessment_results")
        .select("role,overall_score")
        .eq("user_id", user.id)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const role = profile?.learning_role;
    if (assessment && isLearningRole(role) && isLearningRole(assessment.role)) {
      const override = (profile as { roadmap_stage_override?: string | null })?.roadmap_stage_override;
      const threshold = await resolvePlacementThreshold();
      const stage =
        override === "beginner" || override === "intermediate"
          ? override
          : resolveStageForScore(assessment.overall_score, threshold);
      const beginnerDays = roadmapTotalDays(role, "beginner");
      const intermediateDays = roadmapTotalDays(role, "intermediate");
      expectedJourneyDays = stage === "beginner" ? beginnerDays + intermediateDays : intermediateDays;
    }
  } catch {
    // Fall back to default 90 days
  }

  // User needs a roadmap but doesn't have one - show assignment page
  return <AssigningRoadmap expectedJourneyDays={expectedJourneyDays} />;
}
