import { INTERMEDIATE_DIRECT_SCORE_BAND, STAGE_SCORE_BANDS } from "./config";
import type { RoadmapStage } from "./types";

/**
 * Stage-aware Talent Score banding.
 *
 * The base engine (`lib/score/calculate.ts`) is unchanged: it still adds up
 * projects, skills, community, completion, recognition, reading and quizzes
 * into a 0-1000 raw total. This module maps that raw total into the band the
 * learner's current stage allows, so a Beginner a few lessons in can never
 * show the same number as an Intermediate doing production-grade work.
 *
 * Bands
 *   Beginner .............. 150 -> 650
 *   Intermediate (promoted) 650 -> 1000
 *   Intermediate (direct) .. 350-500 -> 1000, floor scaled by placement score
 *
 * Pure functions only — no I/O — so every rule is unit tested.
 */

export type ScoreBand = { floor: number; ceiling: number };

/**
 * The band for a learner.
 *
 * A learner placed straight into Intermediate has not earned the Beginner
 * stage's 650, so their floor scales with how strongly they placed rather than
 * being granted outright.
 */
export function resolveScoreBand(params: {
  stage: RoadmapStage;
  entryStage: RoadmapStage;
  /** 0-100 placement assessment score. */
  assessmentScore?: number | null;
  /** Threshold that put them in this stage, used to scale the direct floor. */
  placementThreshold?: number;
}): ScoreBand {
  const { stage, entryStage } = params;

  if (stage === "beginner") return { ...STAGE_SCORE_BANDS.beginner };

  // Promoted into Intermediate: they completed the whole Beginner roadmap.
  if (entryStage === "beginner") return { ...STAGE_SCORE_BANDS.intermediate };

  // Direct Intermediate placement: interpolate the floor across the band using
  // how far above the threshold they scored.
  const score = Math.max(0, Math.min(100, Number(params.assessmentScore ?? 0)));
  const threshold = Math.max(0, Math.min(100, Number(params.placementThreshold ?? 60)));
  const headroom = Math.max(1, 100 - threshold);
  const ratio = Math.max(0, Math.min(1, (score - threshold) / headroom));

  const { minFloor, maxFloor, ceiling } = INTERMEDIATE_DIRECT_SCORE_BAND;
  return { floor: Math.round(minFloor + (maxFloor - minFloor) * ratio), ceiling };
}

/**
 * Projects a raw 0-1000 score into a stage band.
 *
 * The raw total is treated as a position within 0-1000 and rescaled into
 * [floor, ceiling]. Relative ranking inside a stage is preserved (better work
 * still scores higher), while the stage's ceiling is never exceeded.
 */
export function applyStageBand(rawTotal: number, band: ScoreBand): number {
  const raw = Math.max(0, Math.min(1000, Math.round(rawTotal)));
  const span = Math.max(0, band.ceiling - band.floor);
  return Math.round(band.floor + (raw / 1000) * span);
}

/**
 * The learner-facing score.
 *
 * `hasRoadmap` guards the floor: someone who has not been assigned a roadmap
 * yet should not be handed 150 points for nothing.
 */
export function stageAdjustedTotal(params: {
  rawTotal: number;
  stage: RoadmapStage;
  entryStage: RoadmapStage;
  hasRoadmap: boolean;
  assessmentScore?: number | null;
  placementThreshold?: number;
}): number {
  if (!params.hasRoadmap) return Math.max(0, Math.min(1000, Math.round(params.rawTotal)));
  const band = resolveScoreBand(params);
  return applyStageBand(params.rawTotal, band);
}
