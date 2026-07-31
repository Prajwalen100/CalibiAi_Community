import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLearningRole } from "@/lib/learning/content";
import { computeJourneyState, resolveStageForScore } from "@/lib/roadmap/engine";
import { loadRoadmap, roadmapTotalDays } from "@/lib/roadmap/loader";
import { resolvePlacementThreshold } from "@/lib/roadmap/settings";
import {
  buildStoredPlan,
  seedStageProgress,
  syncJourneyToProfile,
  type ActiveAssignment,
} from "@/lib/roadmap/service";
import type { LoadedRoadmap, RoadmapStage } from "@/lib/roadmap/types";
import type { Result } from "@/lib/services/onboarding";

/**
 * Initial roadmap assignment, immediately after the placement assessment.
 *
 * All roadmap loading, transformation and journey maths now live in
 * `lib/roadmap/*`; this module is only responsible for the database side of
 * the first assignment. The previous inline copies of `loadRoadmap`,
 * `generateWeeklyTargets` and `transformDayForDashboard` were removed so
 * there is exactly one implementation of each.
 *
 * The existing roadmap JSONs are the single source of truth — nothing here
 * creates or duplicates roadmap content.
 */

/** Stage placement derived from the learner's assessment score. */
async function resolvePlacement(assessmentScore: number | null | undefined): Promise<{
  stage: RoadmapStage;
  threshold: number;
}> {
  const threshold = await resolvePlacementThreshold();
  return { stage: resolveStageForScore(assessmentScore, threshold), threshold };
}

/**
 * Deterministically assigns a roadmap after the assessment.
 *
 * Retry-safe: a partially-created active assignment is reused and its progress
 * rows are upserted before onboarding is unlocked.
 */
export async function assignRoadmap(): Promise<Result<{ userRoadmapId: string }>> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: "Please sign in again.", code: "UNAUTHENTICATED" } };
  }

  const [{ data: profile, error: profileError }, { data: assessment, error: assessmentError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("learning_role,onboarding_completed,roadmap_stage_override")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("assessment_results")
      .select("id,role,level,overall_score")
      .eq("user_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileError || !profile) {
    return { data: null, error: { message: "Your onboarding profile could not be loaded.", code: profileError?.code } };
  }
  if (assessmentError) {
    return { data: null, error: { message: "Your assessment result could not be loaded.", code: assessmentError.code } };
  }
  if (!assessment || !isLearningRole(assessment.role) || !isLearningRole(profile.learning_role)) {
    return { data: null, error: { message: "Complete the placement assessment before assigning your roadmap." } };
  }
  if (assessment.role !== profile.learning_role) {
    return { data: null, error: { message: "Your assessment role no longer matches your selected role. Please retake the assessment." } };
  }

  const assessmentScore = Number(assessment.overall_score ?? 0);

  // An admin override always wins; otherwise the configurable threshold
  // decides. `assessment.level` is used only as a legacy fallback.
  const override = (profile as { roadmap_stage_override?: string | null }).roadmap_stage_override;
  const placement = await resolvePlacement(assessmentScore);
  const stage: RoadmapStage =
    override === "beginner" || override === "intermediate"
      ? override
      : placement.stage;

  let roadmap: LoadedRoadmap;
  try {
    roadmap = loadRoadmap(assessment.role, stage);
  } catch (error) {
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : "The selected roadmap could not be loaded." },
    };
  }

  // A learner entering on Beginner has a two-stage, 90-day journey; entering
  // directly on Intermediate is a single 45-day journey.
  const entryStage = stage;
  const overallJourneyDays =
    entryStage === "beginner"
      ? roadmap.totalDays + roadmapTotalDays(assessment.role, "intermediate")
      : roadmap.totalDays;

  const { data: graphRow } = await supabase
    .from("knowledge_graph")
    .select("graph")
    .eq("assessment_result_id", assessment.id)
    .maybeSingle();
  const graph = graphRow?.graph as { weak_skills?: string[]; strong_skills?: string[] } | null | undefined;

  let { data: assignment, error: assignmentReadError } = await supabase
    .from("user_roadmaps")
    .select("id,roadmap_id")
    .eq("user_id", user.id)
    .eq("role", assessment.role)
    .eq("status", "active")
    .maybeSingle();

  if (assignmentReadError) {
    return {
      data: null,
      error: {
        message: "Roadmap assignment is unavailable. Make sure the latest Supabase migrations are applied.",
        code: assignmentReadError.code,
      },
    };
  }

  const storedPlan = {
    ...buildStoredPlan(roadmap, {
      assessmentScore,
      entryStage,
      stage,
      overallJourneyDays,
      focusSkills: graph?.weak_skills ?? [],
      strongSkills: graph?.strong_skills ?? [],
      assessmentResultId: assessment.id,
    }),
    personalization: {
      focus_skills: graph?.weak_skills ?? [],
      strong_skills: graph?.strong_skills ?? [],
      weak_skill_days: roadmap.days
        .filter((day) =>
          day.skills_gained?.some((skill) =>
            graph?.weak_skills?.some(
              (weak) =>
                skill.toLowerCase().includes(weak.toLowerCase()) ||
                weak.toLowerCase().includes(skill.toLowerCase()),
            ),
          ),
        )
        .map((day) => day.day),
    },
  };

  if (!assignment) {
    const { data: catalogRow, error: catalogError } = await supabase
      .from("roadmaps")
      .insert({ user_id: user.id, role: assessment.role, generated_plan: storedPlan })
      .select("id")
      .single();

    if (catalogError || !catalogRow) {
      return { data: null, error: { message: "We couldn't save your roadmap. Please retry.", code: catalogError?.code } };
    }

    const created = await supabase
      .from("user_roadmaps")
      .insert({
        user_id: user.id,
        roadmap_id: catalogRow.id,
        role: assessment.role,
        level: stage,
        // Journey mapping (migration 025). Pointers only, never content.
        roadmap_stage: stage,
        entry_stage: entryStage,
        stage_index: 1,
        roadmap_file: roadmap.fileName,
        overall_journey_days: overallJourneyDays,
        assessment_score: assessmentScore,
        status: "active",
        personalization: {
          sequence: roadmap.days.map((day) => day.day),
          day_actions: {},
          focus_skills: graph?.weak_skills ?? [],
          strong_skills: graph?.strong_skills ?? [],
          weekly_targets: roadmap.weeklyTargets,
          version: 3,
          source: "deterministic",
        },
      })
      .select("id,roadmap_id")
      .single();

    if (created.error || !created.data) {
      // A duplicate request may have won the unique-index race. Reuse it.
      const retry = await supabase
        .from("user_roadmaps")
        .select("id,roadmap_id")
        .eq("user_id", user.id)
        .eq("role", assessment.role)
        .eq("status", "active")
        .maybeSingle();
      assignment = retry.data;
      assignmentReadError = retry.error;
      if (assignmentReadError || !assignment) {
        return { data: null, error: { message: "We couldn't activate your roadmap. Please retry.", code: created.error?.code } };
      }
    } else {
      assignment = created.data;
    }
  }

  const seeded = await seedStageProgress(supabase, user.id, assignment.id, roadmap.days);
  if (!seeded.ok) {
    return { data: null, error: { message: seeded.message ?? "We couldn't prepare your roadmap days. Please retry." } };
  }

  const { data: completedProfile, error: completeError } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true, onboarding_step: 5 })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();
  if (completeError || !completedProfile) {
    return { data: null, error: { message: "We couldn't finish onboarding. Please retry.", code: completeError?.code } };
  }

  // Mirror the freshly-computed journey onto the profile so the dashboard and
  // admin filters have the mapping available without recomputing it.
  const initialState = computeJourneyState({
    entryStage,
    currentStage: stage,
    stageTotalDays: roadmap.totalDays,
    stageProgress: [],
    beginnerTotalDays: entryStage === "beginner" ? roadmap.totalDays : 0,
  });
  await syncJourneyToProfile(supabase, user.id, initialState);

  // Seed the score row with the assessment contribution. This is an
  // initializer, not a reset: `ignoreDuplicates` protects an existing score.
  const assessmentScorePoints = Math.round(assessmentScore * 0.5);

  await Promise.all([
    supabase.from("scores").upsert(
      {
        user_id: user.id,
        projects_pts: 0,
        skills_pts: 0,
        community_pts: 0,
        completion_pts: assessmentScorePoints,
        recognition_pts: 0,
        total: assessmentScorePoints,
        tier: assessmentScorePoints >= 75 ? "silver" : "bronze",
        last_calculated_at: new Date().toISOString(),
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    ),
    supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "roadmap_assigned",
      metadata: {
        role: assessment.role,
        level: stage,
        stage,
        entry_stage: entryStage,
        overall_journey_days: overallJourneyDays,
        placement_threshold: placement.threshold,
        stage_overridden: Boolean(override),
        user_roadmap_id: assignment.id,
        assessment_score: assessmentScore,
        completion_pts_awarded: assessmentScorePoints,
      },
    }),
  ]);

  return { data: { userRoadmapId: assignment.id }, error: null };
}

export type { ActiveAssignment };
export type { RoadmapDayContent as RoadmapDay, WeeklyTarget } from "@/lib/roadmap/types";
