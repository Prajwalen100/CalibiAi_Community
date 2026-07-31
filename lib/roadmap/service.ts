import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ROADMAP_PROGRESS_LOCK_COLUMNS } from "@/lib/learning/day-access";
import { isLearningRole, ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";

import { JOURNEY_MILESTONES } from "./config";
import { computeJourneyState, resolveStageForScore, stageLabel, type JourneyState } from "./engine";
import { loadRoadmap, roadmapTotalDays } from "./loader";
import { getRoadmapSettings } from "./settings";
import { isRoadmapStage, type LoadedRoadmap, type RoadmapStage, type StageProgressRow } from "./types";

/**
 * Roadmap service: the only place that reads or writes a learner's roadmap
 * mapping. Pages, the scoring engine and the admin panel all go through here,
 * so day/week/progress numbers are computed once and can never disagree.
 *
 * CRITICAL INVARIANT
 * ------------------
 * `roadmap_progress` rows are ALWAYS filtered by the active `user_roadmap_id`.
 * Both stages number their days 1..45, so a user_id-only filter would mix
 * Beginner Day 3 with Intermediate Day 3 once a learner holds both stages.
 */

type MinimalSupabase = Pick<SupabaseClient, "from">;

export type ActiveAssignment = {
  id: string;
  roadmapId: string | null;
  role: LearningRole;
  stage: RoadmapStage;
  entryStage: RoadmapStage;
  stageIndex: number;
  assessmentScore: number | null;
};

/** Everything a page needs to render a learner's roadmap. */
export type RoadmapContext = {
  hasRoadmap: boolean;
  assignment: ActiveAssignment | null;
  role: LearningRole | null;
  roleTitle: string;
  /** The current stage's loaded JSON. */
  current: LoadedRoadmap | null;
  state: JourneyState | null;
  progress: StageProgressRow[];
  stageLabel: string;
  journeyTitle: string;
};

const EMPTY_CONTEXT: RoadmapContext = {
  hasRoadmap: false,
  assignment: null,
  role: null,
  roleTitle: "AI Engineer",
  current: null,
  state: null,
  progress: [],
  stageLabel: "Beginner",
  journeyTitle: "",
};

/** Reads the learner's single active roadmap assignment. */
export async function getActiveAssignment(
  supabase: MinimalSupabase,
  userId: string,
): Promise<ActiveAssignment | null> {
  const { data, error } = await supabase
    .from("user_roadmaps")
    .select("id,roadmap_id,role,level,entry_stage,roadmap_stage,stage_index,assessment_score")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("stage_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const role = row.role;
  if (!isLearningRole(role)) return null;

  // `roadmap_stage` is the explicit mapping column; `level` is the pre-existing
  // one. Fall back so rows written before migration 025 still resolve.
  const stage = isRoadmapStage(row.roadmap_stage)
    ? row.roadmap_stage
    : isRoadmapStage(row.level)
      ? row.level
      : "beginner";
  const entryStage = isRoadmapStage(row.entry_stage) ? row.entry_stage : stage;

  return {
    id: String(row.id),
    roadmapId: row.roadmap_id ? String(row.roadmap_id) : null,
    role,
    stage,
    entryStage,
    stageIndex: Number(row.stage_index ?? 1),
    assessmentScore: row.assessment_score === null || row.assessment_score === undefined
      ? null
      : Number(row.assessment_score),
  };
}

/** Progress rows for ONE stage, scoped by its `user_roadmap_id`. */
export async function getStageProgress(
  supabase: MinimalSupabase,
  userId: string,
  userRoadmapId: string,
): Promise<StageProgressRow[]> {
  const { data, error } = await supabase
    .from("roadmap_progress")
    .select(ROADMAP_PROGRESS_LOCK_COLUMNS)
    .eq("user_id", userId)
    .eq("user_roadmap_id", userRoadmapId)
    .order("day", { ascending: true });

  if (error || !data) return [];
  return data as StageProgressRow[];
}

/** Completed-day count for an earlier, archived stage. */
async function getArchivedStageCompletedDays(
  supabase: MinimalSupabase,
  userId: string,
  role: LearningRole,
  stage: RoadmapStage,
): Promise<number | null> {
  const { data } = await supabase
    .from("user_roadmaps")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role)
    .eq("roadmap_stage", stage)
    .neq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.id) return null;

  const { count } = await supabase
    .from("roadmap_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("user_roadmap_id", data.id)
    .eq("status", "completed");

  return count ?? null;
}

/**
 * Builds the full roadmap context for a learner. This is the single entry
 * point every page uses.
 */
export async function getRoadmapContext(
  supabase: MinimalSupabase,
  userId: string,
): Promise<RoadmapContext> {
  const assignment = await getActiveAssignment(supabase, userId);
  if (!assignment) return EMPTY_CONTEXT;

  let current: LoadedRoadmap;
  let beginnerTotalDays = 0;
  try {
    current = loadRoadmap(assignment.role, assignment.stage);
    beginnerTotalDays =
      assignment.entryStage === "beginner" ? roadmapTotalDays(assignment.role, "beginner") : 0;
  } catch {
    // A missing or malformed JSON must not take down the dashboard.
    return { ...EMPTY_CONTEXT, assignment, role: assignment.role };
  }

  const progress = await getStageProgress(supabase, userId, assignment.id);

  // When the learner is on stage 2, stage 1 is complete by definition; read the
  // archived row's real count so overall progress stays exact even if a day was
  // reopened administratively.
  let beginnerCompletedDays: number | undefined;
  if (assignment.entryStage === "beginner" && assignment.stage === "intermediate") {
    beginnerCompletedDays =
      (await getArchivedStageCompletedDays(supabase, userId, assignment.role, "beginner")) ??
      beginnerTotalDays;
  }

  const state = computeJourneyState({
    entryStage: assignment.entryStage,
    currentStage: assignment.stage,
    stageTotalDays: current.totalDays,
    stageProgress: progress,
    beginnerTotalDays,
    beginnerCompletedDays,
  });

  const roleTitle = ROLE_DETAILS[assignment.role].title;

  return {
    hasRoadmap: true,
    assignment,
    role: assignment.role,
    roleTitle,
    current,
    state,
    progress,
    stageLabel: stageLabel(assignment.stage),
    journeyTitle: `${state.overallJourneyDays}-Day ${roleTitle} Journey`,
  };
}

/** Creates the `roadmap_progress` rows for a stage. Idempotent. */
export async function seedStageProgress(
  supabase: MinimalSupabase,
  userId: string,
  userRoadmapId: string,
  days: { day: number }[],
): Promise<{ ok: boolean; message?: string }> {
  const rows = days.map((day) => ({
    user_id: userId,
    user_roadmap_id: userRoadmapId,
    // `module_id` is namespaced by the assignment id, so the two stages'
    // day-1..45 rows never collide on the (user_id, module_id) unique index.
    module_id: `${userRoadmapId}:day:${day.day}`,
    day: day.day,
    prereq_days: day.day === 1 ? [] : [day.day - 1],
    status: day.day === 1 ? "not_started" : "locked",
    unlock_at: day.day === 1 ? new Date().toISOString() : null,
  }));

  const { error } = await supabase
    .from("roadmap_progress")
    .upsert(rows, { onConflict: "user_id,module_id" });

  if (error) return { ok: false, message: "We couldn't prepare your roadmap days." };
  return { ok: true };
}

/** Mirrors the computed journey onto `profiles` for fast reads and admin filters. */
export async function syncJourneyToProfile(
  supabase: MinimalSupabase,
  userId: string,
  state: JourneyState,
): Promise<void> {
  await supabase
    .from("profiles")
    .update({
      roadmap_entry_stage: state.entryStage,
      roadmap_stage: state.currentStage,
      overall_journey_days: state.overallJourneyDays,
      current_overall_day: state.currentOverallDay,
      current_stage_day: state.currentStageDay,
      current_overall_week: state.currentOverallWeek,
      current_stage_week: state.currentStageWeek,
      beginner_completed: state.beginnerCompleted,
      intermediate_completed: state.intermediateCompleted,
      roadmap_completed: state.journeyCompleted,
    })
    .eq("user_id", userId);
}

/** Records a milestone once. Safe to call repeatedly. */
export async function recordMilestone(
  supabase: MinimalSupabase,
  userId: string,
  milestone: string,
  details: { role?: string; stage?: RoadmapStage; userRoadmapId?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    await supabase.from("roadmap_milestones").insert({
      user_id: userId,
      milestone,
      role: details.role ?? null,
      stage: details.stage ?? null,
      user_roadmap_id: details.userRoadmapId ?? null,
      metadata: details.metadata ?? {},
    });
  } catch {
    // The UNIQUE(user_id, milestone) constraint makes repeat calls a no-op.
  }
}

export type PromotionResult = {
  promoted: boolean;
  fromStage?: RoadmapStage;
  toStage?: RoadmapStage;
  userRoadmapId?: string;
  reason?: string;
};

/**
 * Promotes a learner to the next stage when their current one is complete.
 *
 * Archives the finished assignment and activates the next, reusing the
 * existing roadmap JSON. No new user is created and no roadmap content is
 * duplicated — only a new mapping row plus its progress rows.
 *
 * Safe to call on every dashboard render: it exits immediately unless the
 * current stage is actually complete.
 */
export async function maybePromoteStage(
  supabase: MinimalSupabase,
  userId: string,
  context: RoadmapContext,
): Promise<PromotionResult> {
  const { assignment, state, role } = context;
  if (!assignment || !state || !role) return { promoted: false, reason: "no-assignment" };
  if (!state.currentStageCompleted) return { promoted: false, reason: "stage-incomplete" };

  // Final stage finished: record the terminal milestones, nothing to promote.
  if (!state.promotionTarget) {
    if (state.journeyCompleted) {
      await recordMilestone(supabase, userId, JOURNEY_MILESTONES.intermediateCompleted, {
        role,
        stage: "intermediate",
        userRoadmapId: assignment.id,
      });
      await recordMilestone(supabase, userId, JOURNEY_MILESTONES.productionReady, {
        role,
        stage: "intermediate",
        userRoadmapId: assignment.id,
      });
    }
    return { promoted: false, reason: "journey-complete" };
  }

  const settings = await getRoadmapSettings();
  if (!settings.autoPromotionEnabled) return { promoted: false, reason: "auto-promotion-disabled" };

  const target = state.promotionTarget;

  let nextRoadmap: LoadedRoadmap;
  try {
    nextRoadmap = loadRoadmap(role, target);
  } catch {
    return { promoted: false, reason: "next-roadmap-unavailable" };
  }

  await recordMilestone(supabase, userId, JOURNEY_MILESTONES.beginnerCompleted, {
    role,
    stage: assignment.stage,
    userRoadmapId: assignment.id,
  });

  // Archive first: `one_active_learning_roadmap` is a unique index on
  // (user_id, role) WHERE status='active', so the new row cannot be inserted
  // while the old one is still active.
  const { error: archiveError } = await supabase
    .from("user_roadmaps")
    .update({ status: "completed", stage_completed_at: new Date().toISOString() })
    .eq("id", assignment.id)
    .eq("status", "active");

  if (archiveError) return { promoted: false, reason: "archive-failed" };

  // Point the catalog row at the next stage's JSON. This UPDATES the existing
  // `roadmaps` row rather than inserting a second one, so a learner never
  // accumulates duplicate roadmap records.
  const overallJourneyDays = state.overallJourneyDays;
  if (assignment.roadmapId) {
    await supabase
      .from("roadmaps")
      .update({
        generated_plan: buildStoredPlan(nextRoadmap, {
          assessmentScore: assignment.assessmentScore,
          entryStage: assignment.entryStage,
          stage: target,
          overallJourneyDays,
        }),
      })
      .eq("id", assignment.roadmapId);
  }

  const { data: created, error: createError } = await supabase
    .from("user_roadmaps")
    .insert({
      user_id: userId,
      roadmap_id: assignment.roadmapId,
      role,
      level: target,
      roadmap_stage: target,
      entry_stage: assignment.entryStage,
      stage_index: assignment.stageIndex + 1,
      roadmap_file: nextRoadmap.fileName,
      overall_journey_days: overallJourneyDays,
      assessment_score: assignment.assessmentScore,
      status: "active",
      personalization: {
        sequence: nextRoadmap.days.map((day) => day.day),
        day_actions: {},
        weekly_targets: nextRoadmap.weeklyTargets,
        version: 3,
        source: "stage-promotion",
      },
    })
    .select("id")
    .single();

  if (createError || !created) {
    // Roll the archive back so the learner is never left with no active stage.
    await supabase
      .from("user_roadmaps")
      .update({ status: "active", stage_completed_at: null })
      .eq("id", assignment.id);
    return { promoted: false, reason: "activate-failed" };
  }

  const seeded = await seedStageProgress(supabase, userId, created.id, nextRoadmap.days);
  if (!seeded.ok) return { promoted: false, reason: "seed-failed" };

  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "roadmap_stage_promoted",
    metadata: {
      role,
      from_stage: assignment.stage,
      to_stage: target,
      user_roadmap_id: created.id,
      overall_journey_days: overallJourneyDays,
    },
  });

  return {
    promoted: true,
    fromStage: assignment.stage,
    toStage: target,
    userRoadmapId: created.id,
  };
}

/**
 * The `roadmaps.generated_plan` payload.
 *
 * Holds the transformed view of the CURRENT stage plus journey mapping. This
 * is a derived cache of an existing JSON, not a second copy of the curriculum:
 * it is rewritten (never appended to) whenever the stage changes.
 */
export function buildStoredPlan(
  roadmap: LoadedRoadmap,
  journey: {
    assessmentScore: number | null;
    entryStage: RoadmapStage;
    stage: RoadmapStage;
    overallJourneyDays: number;
    focusSkills?: string[];
    strongSkills?: string[];
    assessmentResultId?: string;
  },
) {
  return {
    roadmap: roadmap.roadmap,
    file_key: roadmap.fileName,
    assessment_result_id: journey.assessmentResultId,
    assessment_score: journey.assessmentScore ?? 0,
    weeklyTargets: roadmap.weeklyTargets,
    days: roadmap.days,
    totalDays: roadmap.totalDays,
    totalWeeks: roadmap.totalWeeks,
    // Journey mapping — pointers only.
    entry_stage: journey.entryStage,
    roadmap_stage: journey.stage,
    overall_journey_days: journey.overallJourneyDays,
    personalization: {
      focus_skills: journey.focusSkills ?? [],
      strong_skills: journey.strongSkills ?? [],
      weak_skill_days: [] as number[],
    },
  };
}

export { resolveStageForScore };
