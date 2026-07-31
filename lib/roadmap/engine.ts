import { DAYS_PER_WEEK, DEFAULT_PLACEMENT_THRESHOLD } from "./config";
import {
  isRoadmapStage,
  nextStage,
  type DashboardDay,
  type RoadmapStage,
  type StageProgressRow,
  type WeeklyTarget,
} from "./types";

/**
 * The roadmap engine: pure, deterministic calculations.
 *
 * Deliberately free of `fs`, Supabase and React so every rule here is unit
 * testable in isolation. Loading JSON is `loader.ts`; reading/writing the
 * database is `service.ts`.
 *
 * KEY MODEL
 * ---------
 * A learner's journey is one or two *stages*, each backed by an existing
 * roadmap JSON of 45 days:
 *
 *   Beginner-start  -> beginner (days 1-45) then intermediate (days 1-45)
 *                      = 90 overall days, 14 overall weeks
 *   Intermediate-direct -> intermediate only (days 1-45)
 *                      = 45 overall days, 7 overall weeks
 *
 * Day numbers are ALWAYS stored per stage, matching the JSON's own 1..45. The
 * "overall" day/week are derived here via `stageOffset`. Nothing overall is
 * ever persisted, so the two stages can never disagree.
 */

/** Placement decision from a raw assessment score. */
export function resolveStageForScore(
  assessmentScore: number | null | undefined,
  threshold: number = DEFAULT_PLACEMENT_THRESHOLD,
): RoadmapStage {
  const score = Number(assessmentScore ?? 0);
  if (!Number.isFinite(score)) return "beginner";
  return score >= threshold ? "intermediate" : "beginner";
}

/**
 * The stage a learner *entered* the product at. This is durable: it defines
 * whether the journey is 45 or 90 days and never changes on promotion.
 */
export type EntryStage = RoadmapStage;

/** Number of days that precede `stage` for a learner who entered at `entry`. */
export function stageOffset(entry: EntryStage, stage: RoadmapStage, beginnerDays: number): number {
  // Only a beginner-entry learner ever has days before their current stage.
  if (entry === "beginner" && stage === "intermediate") return beginnerDays;
  return 0;
}

/** Ordered stages for a journey that started at `entry`. */
export function stagesForEntry(entry: EntryStage): RoadmapStage[] {
  return entry === "beginner" ? ["beginner", "intermediate"] : ["intermediate"];
}

/** Week number (1-based) for a 1-based day number. */
export function weekForDay(day: number): number {
  if (!Number.isFinite(day) || day < 1) return 1;
  return Math.floor((day - 1) / DAYS_PER_WEEK) + 1;
}

/** Total weeks needed to cover `totalDays`. */
export function weeksForDays(totalDays: number): number {
  if (!Number.isFinite(totalDays) || totalDays <= 0) return 0;
  return Math.ceil(totalDays / DAYS_PER_WEEK);
}

/**
 * Number of weeks that precede `stage` for a learner who entered at `entry`.
 *
 * Weeks are concatenated PER STAGE rather than derived from the overall day
 * number. A 45-day stage is 7 weeks, so a promoted learner starts their
 * Intermediate roadmap at overall week 8 and finishes at week 14.
 *
 * Deriving the week from the overall day instead would give
 * `ceil(90/7) = 13` weeks and place overall day 46 in week 7 — a week that
 * straddles both stages, which is wrong both for the UI and for the learner's
 * mental model of "Week 1 of Intermediate".
 */
export function stageWeekOffset(entry: EntryStage, stage: RoadmapStage, beginnerDays: number): number {
  if (entry === "beginner" && stage === "intermediate") return weeksForDays(beginnerDays);
  return 0;
}

/** Counts days marked completed, ignoring rows without a usable day number. */
export function countCompletedDays(progress: StageProgressRow[]): number {
  return progress.filter((row) => row.status === "completed" && Number.isFinite(Number(row.day))).length;
}

/**
 * The learner's current day within a stage: the first day that is not yet
 * completed. When every day is done it stays pinned at the last day, so the
 * dashboard never points past the end of the roadmap.
 */
export function currentDayForStage(totalDays: number, progress: StageProgressRow[]): number {
  if (totalDays <= 0) return 1;
  const completed = new Set(
    progress.filter((row) => row.status === "completed").map((row) => Number(row.day)),
  );
  for (let day = 1; day <= totalDays; day += 1) {
    if (!completed.has(day)) return day;
  }
  return totalDays;
}

/** True when every day in the stage is completed. */
export function isStageComplete(totalDays: number, progress: StageProgressRow[]): boolean {
  if (totalDays <= 0) return false;
  const completed = new Set(
    progress.filter((row) => row.status === "completed").map((row) => Number(row.day)),
  );
  for (let day = 1; day <= totalDays; day += 1) {
    if (!completed.has(day)) return false;
  }
  return true;
}

/**
 * A fully resolved view of where a learner is, in both stage-local and overall
 * terms. This is the single object the dashboard, roadmap page and scoring
 * engine all read from.
 */
export type JourneyState = {
  /** Stage the learner entered at. Determines journey length. */
  entryStage: EntryStage;
  /** Stage they are working on right now. */
  currentStage: RoadmapStage;
  /** Ordered stages in this journey. */
  stages: RoadmapStage[];

  /** Day within the current stage (1..stageTotalDays). */
  currentStageDay: number;
  /** Week within the current stage (1..stageTotalWeeks). */
  currentStageWeek: number;
  stageTotalDays: number;
  stageTotalWeeks: number;
  stageCompletedDays: number;
  /** 0-100. */
  stageProgressPercent: number;

  /** Day across the whole journey (1..overallJourneyDays). */
  currentOverallDay: number;
  /** Week across the whole journey (1..overallJourneyWeeks). */
  currentOverallWeek: number;
  overallJourneyDays: number;
  overallJourneyWeeks: number;
  overallCompletedDays: number;
  /** 0-100. */
  overallProgressPercent: number;
  overallRemainingDays: number;

  beginnerCompleted: boolean;
  intermediateCompleted: boolean;
  /** Current stage finished — the trigger for auto-promotion. */
  currentStageCompleted: boolean;
  /** Every stage in the journey finished. */
  journeyCompleted: boolean;
  /** Stage to promote into, or null. */
  promotionTarget: RoadmapStage | null;
};

export type JourneyInput = {
  entryStage: EntryStage;
  currentStage: RoadmapStage;
  /** Day count of the current stage's JSON. */
  stageTotalDays: number;
  /** Progress rows for the CURRENT stage only (scoped by user_roadmap_id). */
  stageProgress: StageProgressRow[];
  /**
   * Completed day count for the beginner stage, when the learner has already
   * finished it and moved on. Lets overall progress account for stage 1
   * without re-reading its rows.
   */
  beginnerCompletedDays?: number;
  /** Day count of the beginner JSON. Required for beginner-entry journeys. */
  beginnerTotalDays?: number;
};

/** Computes the complete journey state. The heart of the engine. */
export function computeJourneyState(input: JourneyInput): JourneyState {
  const entryStage = isRoadmapStage(input.entryStage) ? input.entryStage : "beginner";
  const currentStage = isRoadmapStage(input.currentStage) ? input.currentStage : entryStage;
  const stages = stagesForEntry(entryStage);

  const stageTotalDays = Math.max(0, Math.floor(input.stageTotalDays));
  const stageTotalWeeks = weeksForDays(stageTotalDays);
  const stageCompletedDays = Math.min(stageTotalDays, countCompletedDays(input.stageProgress));
  const currentStageDay = currentDayForStage(stageTotalDays, input.stageProgress);
  const currentStageWeek = Math.min(Math.max(1, stageTotalWeeks), weekForDay(currentStageDay));
  const currentStageCompleted = isStageComplete(stageTotalDays, input.stageProgress);

  // Overall journey length. A beginner-entry learner's journey spans both
  // stages even before the second one is assigned, which is what makes the
  // hero read "90-Day AI Engineer Journey" from day 1.
  const beginnerTotalDays = Math.max(0, Math.floor(input.beginnerTotalDays ?? 0));
  const overallJourneyDays =
    entryStage === "beginner"
      ? (currentStage === "beginner" ? stageTotalDays : beginnerTotalDays) +
        (currentStage === "beginner" ? beginnerTotalDays : stageTotalDays)
      : stageTotalDays;

  const offset = stageOffset(entryStage, currentStage, beginnerTotalDays);

  // Days finished in stages before the current one.
  const priorCompleted =
    entryStage === "beginner" && currentStage === "intermediate"
      ? Math.min(beginnerTotalDays, Math.max(0, Math.floor(input.beginnerCompletedDays ?? beginnerTotalDays)))
      : 0;

  const overallCompletedDays = Math.min(overallJourneyDays, priorCompleted + stageCompletedDays);
  const currentOverallDay = Math.min(Math.max(1, overallJourneyDays), offset + currentStageDay);

  // Weeks are concatenated per stage (7 + 7 = 14), not derived from the
  // overall day count, so Intermediate always begins at "Week 8" for a
  // promoted learner. See `stageWeekOffset` for the full rationale.
  const overallJourneyWeeks =
    entryStage === "beginner"
      ? weeksForDays(beginnerTotalDays) + weeksForDays(currentStage === "beginner" ? beginnerTotalDays : stageTotalDays)
      : weeksForDays(stageTotalDays);
  const weekOffset = stageWeekOffset(entryStage, currentStage, beginnerTotalDays);
  const currentOverallWeek = Math.min(Math.max(1, overallJourneyWeeks), weekOffset + currentStageWeek);

  const beginnerCompleted =
    entryStage === "intermediate"
      ? false
      : currentStage === "intermediate"
        ? true
        : currentStageCompleted;
  const intermediateCompleted = currentStage === "intermediate" && currentStageCompleted;

  const isLastStage = stages[stages.length - 1] === currentStage;
  const journeyCompleted = isLastStage && currentStageCompleted;
  const promotionTarget = currentStageCompleted && !isLastStage ? nextStage(currentStage) : null;

  return {
    entryStage,
    currentStage,
    stages,
    currentStageDay,
    currentStageWeek,
    stageTotalDays,
    stageTotalWeeks,
    stageCompletedDays,
    stageProgressPercent: stageTotalDays > 0 ? Math.round((stageCompletedDays / stageTotalDays) * 100) : 0,
    currentOverallDay,
    currentOverallWeek,
    overallJourneyDays,
    overallJourneyWeeks,
    overallCompletedDays,
    overallProgressPercent:
      overallJourneyDays > 0 ? Math.round((overallCompletedDays / overallJourneyDays) * 100) : 0,
    overallRemainingDays: Math.max(0, overallJourneyDays - overallCompletedDays),
    beginnerCompleted,
    intermediateCompleted,
    currentStageCompleted,
    journeyCompleted,
    promotionTarget,
  };
}

/** Human-readable journey title, e.g. "90-Day AI Engineer Journey". */
export function journeyTitle(state: JourneyState, roleTitle: string): string {
  return `${state.overallJourneyDays}-Day ${roleTitle} Journey`;
}

/** Display label for a stage. */
export function stageLabel(stage: RoadmapStage): string {
  return stage === "beginner" ? "Beginner" : "Intermediate";
}

/** Today's focus: the current day's content from the current stage's JSON. */
export function selectTodaysFocus(days: DashboardDay[], currentStageDay: number): DashboardDay | null {
  return days.find((day) => day.day === currentStageDay) ?? null;
}

/**
 * Recommended next actions: the remaining days of the learner's current week,
 * then the following days, always sourced from the current stage's JSON.
 */
export function selectRecommendedActions(
  days: DashboardDay[],
  currentStageDay: number,
  limit = 8,
): DashboardDay[] {
  const upcoming = days.filter((day) => day.day >= currentStageDay).sort((a, b) => a.day - b.day);
  if (upcoming.length >= limit) return upcoming.slice(0, limit);
  // Near the end of a stage, backfill with earlier days so the panel is never
  // sparse (the UI renders a fixed-height list).
  const earlier = days.filter((day) => day.day < currentStageDay).sort((a, b) => b.day - a.day);
  return [...upcoming, ...earlier.slice(0, limit - upcoming.length)];
}

/** The weekly target covering the learner's current stage week. */
export function selectCurrentWeekTarget(
  weeklyTargets: WeeklyTarget[],
  currentStageWeek: number,
): WeeklyTarget | null {
  return weeklyTargets.find((target) => target.week === currentStageWeek) ?? null;
}

/** Unlocked = completed, plus the single current day. */
export function countUnlockedDays(state: JourneyState): number {
  return Math.min(state.stageTotalDays, state.stageCompletedDays + 1);
}
