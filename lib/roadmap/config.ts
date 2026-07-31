import type { RoadmapStage } from "./types";

/**
 * Roadmap engine configuration.
 *
 * Every tunable lives here — no magic numbers in the engine, the dashboard or
 * the scoring layer. Values that an admin can change at runtime are resolved
 * through `lib/roadmap/settings.ts`, which layers a database row and an
 * environment variable on top of these defaults.
 */

/** Days per week used to derive week numbers from day numbers. */
export const DAYS_PER_WEEK = 7;

/**
 * Assessment score (0-100) at or above which a learner is placed directly into
 * the Intermediate roadmap. Below it they start on Beginner.
 *
 * This is only the built-in default: `resolvePlacementThreshold()` prefers an
 * admin-managed database value, then `ROADMAP_PLACEMENT_THRESHOLD`, and falls
 * back here.
 */
export const DEFAULT_PLACEMENT_THRESHOLD = 60;

/** Guard rails so a bad admin edit cannot make placement nonsensical. */
export const MIN_PLACEMENT_THRESHOLD = 0;
export const MAX_PLACEMENT_THRESHOLD = 100;

/** Settings keys stored in the `app_settings` table. */
export const SETTINGS_KEYS = {
  placementThreshold: "roadmap.placement_threshold",
  autoPromotionEnabled: "roadmap.auto_promotion_enabled",
} as const;

/**
 * Score band per stage.
 *
 * A Beginner must never be able to reach the same Talent Score as an
 * Intermediate who has done comparable work, so each stage is clamped into its
 * own range. `floor` applies once the learner has any assigned roadmap;
 * `ceiling` is a hard cap for that stage.
 */
export const STAGE_SCORE_BANDS: Record<RoadmapStage, { floor: number; ceiling: number }> = {
  beginner: { floor: 150, ceiling: 650 },
  intermediate: { floor: 650, ceiling: 1000 },
};

/**
 * Learners placed straight into Intermediate have not earned the Beginner
 * stage's 650, so they start on a lower floor that scales with how well they
 * performed on the placement assessment.
 */
export const INTERMEDIATE_DIRECT_SCORE_BAND = {
  minFloor: 350,
  maxFloor: 500,
  ceiling: 1000,
} as const;

/** Milestones recorded when a stage or the whole journey completes. */
export const JOURNEY_MILESTONES = {
  beginnerCompleted: "beginner_completed",
  intermediateCompleted: "intermediate_completed",
  productionReady: "production_ready",
} as const;

export type JourneyMilestone = (typeof JOURNEY_MILESTONES)[keyof typeof JOURNEY_MILESTONES];

/** Clamps an arbitrary value into a valid placement threshold. */
export function normalizePlacementThreshold(value: unknown): number | null {
  const numeric = typeof value === "string" ? Number(value) : typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(numeric)) return null;
  return Math.min(MAX_PLACEMENT_THRESHOLD, Math.max(MIN_PLACEMENT_THRESHOLD, Math.round(numeric)));
}
