"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/admin/auth";
import { isLearningRole } from "@/lib/learning/content";
import { computeJourneyState } from "@/lib/roadmap/engine";
import { loadRoadmap, roadmapTotalDays } from "@/lib/roadmap/loader";
import { buildStoredPlan, seedStageProgress, syncJourneyToProfile } from "@/lib/roadmap/service";
import { setAutoPromotionEnabled, setPlacementThreshold } from "@/lib/roadmap/settings";
import { isRoadmapStage, type RoadmapStage } from "@/lib/roadmap/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Admin roadmap controls.
 *
 * Admins may change the placement threshold, toggle auto-promotion, and
 * assign or override which existing roadmap a learner is on. They can NOT
 * create roadmap content: every action here points a learner at one of the
 * eight JSON files that already exist in `content/roadmap/`.
 */

export type AdminActionState = { ok: boolean; message: string } | null;

async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorised");
  return session;
}

/** Updates the assessment score threshold that decides Beginner vs Intermediate. */
export async function updatePlacementThresholdAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminSession();

  const result = await setPlacementThreshold(formData.get("threshold"));
  if (!result.ok) return { ok: false, message: result.message ?? "Could not save the threshold." };

  revalidatePath("/admin/roadmap");
  return { ok: true, message: "Placement threshold updated." };
}

/** Enables or disables automatic Beginner -> Intermediate promotion. */
export async function updateAutoPromotionAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminSession();

  const enabled = formData.get("enabled") === "true";
  const result = await setAutoPromotionEnabled(enabled);
  if (!result.ok) return { ok: false, message: result.message ?? "Could not save the setting." };

  revalidatePath("/admin/roadmap");
  return { ok: true, message: `Auto-promotion ${enabled ? "enabled" : "disabled"}.` };
}

/**
 * Overrides which stage a learner is on.
 *
 * Archives their current assignment and activates the requested stage against
 * the SAME existing JSON, reusing the learner's `roadmaps` catalog row. No new
 * roadmap record and no duplicated content.
 */
export async function overrideLearnerStageAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminSession();

  const userId = String(formData.get("userId") ?? "").trim();
  const requestedStage = String(formData.get("stage") ?? "").trim();

  if (!userId) return { ok: false, message: "Select a learner first." };
  if (!isRoadmapStage(requestedStage)) return { ok: false, message: "Choose Beginner or Intermediate." };
  const stage: RoadmapStage = requestedStage;

  const supabase = createAdminSupabaseClient();

  const { data: current } = await supabase
    .from("user_roadmaps")
    .select("id,roadmap_id,role,entry_stage,stage_index,assessment_score,roadmap_stage,level")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("stage_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!current) return { ok: false, message: "That learner has no active roadmap to override." };

  const role = current.role;
  if (!isLearningRole(role)) return { ok: false, message: "That learner has no valid learning role." };

  const currentStage = isRoadmapStage(current.roadmap_stage)
    ? current.roadmap_stage
    : isRoadmapStage(current.level)
      ? current.level
      : "beginner";

  if (currentStage === stage) {
    return { ok: true, message: `Learner is already on the ${stage} roadmap.` };
  }

  let roadmap;
  try {
    roadmap = loadRoadmap(role, stage);
  } catch {
    return { ok: false, message: "That roadmap JSON could not be loaded." };
  }

  // Entry stage is durable: overriding the CURRENT stage must not silently
  // rewrite whether this learner's journey is 45 or 90 days.
  const entryStage = isRoadmapStage(current.entry_stage) ? current.entry_stage : currentStage;
  const overallJourneyDays =
    entryStage === "beginner"
      ? roadmapTotalDays(role, "beginner") + roadmapTotalDays(role, "intermediate")
      : roadmapTotalDays(role, "intermediate");

  // Archive the active row first: `one_active_learning_roadmap` is unique on
  // (user_id, role) WHERE status='active'.
  const { error: archiveError } = await supabase
    .from("user_roadmaps")
    .update({ status: "archived", stage_completed_at: new Date().toISOString() })
    .eq("id", current.id)
    .eq("status", "active");
  if (archiveError) return { ok: false, message: "Could not archive the current roadmap." };

  if (current.roadmap_id) {
    await supabase
      .from("roadmaps")
      .update({
        generated_plan: buildStoredPlan(roadmap, {
          assessmentScore: current.assessment_score ?? null,
          entryStage,
          stage,
          overallJourneyDays,
        }),
      })
      .eq("id", current.roadmap_id);
  }

  const { data: created, error: createError } = await supabase
    .from("user_roadmaps")
    .insert({
      user_id: userId,
      roadmap_id: current.roadmap_id,
      role,
      level: stage,
      roadmap_stage: stage,
      entry_stage: entryStage,
      stage_index: Number(current.stage_index ?? 1) + 1,
      roadmap_file: roadmap.fileName,
      overall_journey_days: overallJourneyDays,
      assessment_score: current.assessment_score ?? null,
      status: "active",
      personalization: {
        sequence: roadmap.days.map((day) => day.day),
        day_actions: {},
        weekly_targets: roadmap.weeklyTargets,
        version: 3,
        source: "admin-override",
      },
    })
    .select("id")
    .single();

  if (createError || !created) {
    await supabase
      .from("user_roadmaps")
      .update({ status: "active", stage_completed_at: null })
      .eq("id", current.id);
    return { ok: false, message: "Could not activate the new roadmap. The previous one was restored." };
  }

  const seeded = await seedStageProgress(supabase, userId, created.id, roadmap.days);
  if (!seeded.ok) return { ok: false, message: "Roadmap activated but its days could not be prepared." };

  // Pin future assignments to this stage and refresh the profile mapping.
  await supabase.from("profiles").update({ roadmap_stage_override: stage }).eq("user_id", userId);

  const state = computeJourneyState({
    entryStage,
    currentStage: stage,
    stageTotalDays: roadmap.totalDays,
    stageProgress: [],
    beginnerTotalDays: entryStage === "beginner" ? roadmapTotalDays(role, "beginner") : 0,
    beginnerCompletedDays: entryStage === "beginner" && stage === "intermediate" ? roadmapTotalDays(role, "beginner") : 0,
  });
  await syncJourneyToProfile(supabase, userId, state);

  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "roadmap_stage_override",
    metadata: { from_stage: currentStage, to_stage: stage, role, user_roadmap_id: created.id, source: "admin" },
  });

  revalidatePath("/admin/roadmap");
  return { ok: true, message: `Moved learner to the ${stage} roadmap.` };
}

/** Clears a stage override so placement follows the assessment again. */
export async function clearLearnerOverrideAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdminSession();

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return { ok: false, message: "Select a learner first." };

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({ roadmap_stage_override: null })
    .eq("user_id", userId);

  if (error) return { ok: false, message: "Could not clear the override." };

  revalidatePath("/admin/roadmap");
  return { ok: true, message: "Override cleared. Placement follows the assessment again." };
}
