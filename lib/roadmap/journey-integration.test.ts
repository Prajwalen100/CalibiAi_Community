import { describe, expect, it } from "vitest";

import { computeJourneyState, resolveStageForScore } from "./engine";
import { loadRoadmap, roadmapTotalDays } from "./loader";
import { stageAdjustedTotal } from "./scoring";
import type { RoadmapStage, StageProgressRow } from "./types";

/**
 * End-to-end journey simulations against the REAL roadmap JSONs.
 *
 * These walk the exact flows in the brief — Beginner -> 100% -> Intermediate,
 * and direct-Intermediate placement — asserting the day, week, progress and
 * score values the dashboard will display at each point.
 */

const ROLE = "ai_engineer" as const;

function progressFor(totalDays: number, completed: number): StageProgressRow[] {
  return Array.from({ length: totalDays }, (_, index) => ({
    day: index + 1,
    status: index + 1 <= completed ? "completed" : "locked",
  }));
}

/** Mirrors what `getRoadmapContext` computes, using the real JSON day counts. */
function simulate(params: {
  entryStage: RoadmapStage;
  currentStage: RoadmapStage;
  completedInStage: number;
  beginnerCompletedDays?: number;
}) {
  const stageDays = roadmapTotalDays(ROLE, params.currentStage);
  const beginnerDays = params.entryStage === "beginner" ? roadmapTotalDays(ROLE, "beginner") : 0;
  return computeJourneyState({
    entryStage: params.entryStage,
    currentStage: params.currentStage,
    stageTotalDays: stageDays,
    stageProgress: progressFor(stageDays, params.completedInStage),
    beginnerTotalDays: beginnerDays,
    beginnerCompletedDays: params.beginnerCompletedDays,
  });
}

describe("Beginner user flow", () => {
  it("places a sub-threshold learner on the beginner roadmap", () => {
    expect(resolveStageForScore(45, 60)).toBe("beginner");
  });

  it("starts on a 90-day, 14-week journey at day 1", () => {
    const state = simulate({ entryStage: "beginner", currentStage: "beginner", completedInStage: 0 });
    expect(state.overallJourneyDays).toBe(90);
    expect(state.overallJourneyWeeks).toBe(14);
    expect(state.currentOverallDay).toBe(1);
    expect(state.currentStageDay).toBe(1);
    expect(state.currentOverallWeek).toBe(1);
  });

  it("moves through days 1-45 and weeks 1-7 during the beginner stage", () => {
    const midway = simulate({ entryStage: "beginner", currentStage: "beginner", completedInStage: 20 });
    expect(midway.currentStageDay).toBe(21);
    expect(midway.currentOverallDay).toBe(21);
    expect(midway.currentStageWeek).toBe(3);
    expect(midway.overallProgressPercent).toBe(22);

    const nearEnd = simulate({ entryStage: "beginner", currentStage: "beginner", completedInStage: 44 });
    expect(nearEnd.currentStageDay).toBe(45);
    expect(nearEnd.currentStageWeek).toBe(7);
    expect(nearEnd.promotionTarget).toBeNull();
  });

  it("signals promotion the moment the beginner roadmap hits 100%", () => {
    const complete = simulate({ entryStage: "beginner", currentStage: "beginner", completedInStage: 45 });
    expect(complete.stageProgressPercent).toBe(100);
    expect(complete.currentStageCompleted).toBe(true);
    expect(complete.promotionTarget).toBe("intermediate");
    // Half the 90-day journey is done, so the journey itself is not finished.
    expect(complete.overallProgressPercent).toBe(50);
    expect(complete.journeyCompleted).toBe(false);
  });

  it("continues as days 46-90 and weeks 8-14 after promotion", () => {
    const justPromoted = simulate({
      entryStage: "beginner",
      currentStage: "intermediate",
      completedInStage: 0,
      beginnerCompletedDays: 45,
    });
    expect(justPromoted.currentOverallDay).toBe(46);
    expect(justPromoted.currentOverallWeek).toBe(8);
    expect(justPromoted.currentStageDay).toBe(1);
    expect(justPromoted.currentStageWeek).toBe(1);
    expect(justPromoted.overallJourneyDays).toBe(90);

    const finished = simulate({
      entryStage: "beginner",
      currentStage: "intermediate",
      completedInStage: 45,
      beginnerCompletedDays: 45,
    });
    expect(finished.currentOverallDay).toBe(90);
    expect(finished.currentOverallWeek).toBe(14);
    expect(finished.overallProgressPercent).toBe(100);
    expect(finished.journeyCompleted).toBe(true);
    expect(finished.beginnerCompleted).toBe(true);
    expect(finished.intermediateCompleted).toBe(true);
  });

  it("serves genuinely different content after promotion", () => {
    const beginner = loadRoadmap(ROLE, "beginner");
    const intermediate = loadRoadmap(ROLE, "intermediate");
    expect(beginner.days[0]?.title).not.toBe(intermediate.days[0]?.title);
  });
});

describe("Intermediate direct flow", () => {
  it("places an at-or-above-threshold learner straight onto intermediate", () => {
    expect(resolveStageForScore(60, 60)).toBe("intermediate");
    expect(resolveStageForScore(88, 60)).toBe("intermediate");
  });

  it("runs a 45-day, 7-week journey numbered 1-45", () => {
    const start = simulate({ entryStage: "intermediate", currentStage: "intermediate", completedInStage: 0 });
    expect(start.overallJourneyDays).toBe(45);
    expect(start.overallJourneyWeeks).toBe(7);
    expect(start.currentOverallDay).toBe(1);
    expect(start.currentOverallWeek).toBe(1);

    const end = simulate({ entryStage: "intermediate", currentStage: "intermediate", completedInStage: 45 });
    expect(end.currentOverallDay).toBe(45);
    expect(end.currentOverallWeek).toBe(7);
    expect(end.journeyCompleted).toBe(true);
  });

  it("never claims a beginner stage it did not take", () => {
    const state = simulate({ entryStage: "intermediate", currentStage: "intermediate", completedInStage: 45 });
    expect(state.beginnerCompleted).toBe(false);
    expect(state.stages).toEqual(["intermediate"]);
  });
});

describe("score separation across the journey", () => {
  const raw = 300; // identical underlying work

  it("scores a beginner strictly below a direct intermediate for equal work", () => {
    const beginner = stageAdjustedTotal({
      rawTotal: raw,
      stage: "beginner",
      entryStage: "beginner",
      hasRoadmap: true,
    });
    const direct = stageAdjustedTotal({
      rawTotal: raw,
      stage: "intermediate",
      entryStage: "intermediate",
      assessmentScore: 70,
      placementThreshold: 60,
      hasRoadmap: true,
    });
    expect(beginner).toBeLessThan(direct);
  });

  it("increases a learner's score when they are promoted, never decreases it", () => {
    const beforePromotion = stageAdjustedTotal({
      rawTotal: 1000,
      stage: "beginner",
      entryStage: "beginner",
      hasRoadmap: true,
    });
    const afterPromotion = stageAdjustedTotal({
      rawTotal: 0,
      stage: "intermediate",
      entryStage: "beginner",
      hasRoadmap: true,
    });
    // Finishing Beginner at its 650 ceiling must not drop the learner's score
    // when the Intermediate stage begins.
    expect(afterPromotion).toBeGreaterThanOrEqual(beforePromotion);
  });

  it("keeps every stage inside the documented bands", () => {
    for (const completed of [0, 10, 45]) {
      const beginnerScore = stageAdjustedTotal({
        rawTotal: completed * 20,
        stage: "beginner",
        entryStage: "beginner",
        hasRoadmap: true,
      });
      expect(beginnerScore).toBeGreaterThanOrEqual(150);
      expect(beginnerScore).toBeLessThanOrEqual(650);
    }

    const intermediateScore = stageAdjustedTotal({
      rawTotal: 800,
      stage: "intermediate",
      entryStage: "beginner",
      hasRoadmap: true,
    });
    expect(intermediateScore).toBeGreaterThanOrEqual(650);
    expect(intermediateScore).toBeLessThanOrEqual(1000);
  });
});

describe("no duplicated roadmap data", () => {
  it("reuses one cached instance per role and stage", () => {
    const a = loadRoadmap(ROLE, "beginner");
    const b = loadRoadmap(ROLE, "beginner");
    expect(a).toBe(b);
  });

  it("keeps stage day numbering native to each JSON (1..45, never 46..90)", () => {
    // Overall day 46+ is DERIVED, never stored, so both JSONs stay untouched.
    const intermediate = loadRoadmap(ROLE, "intermediate");
    expect(intermediate.days[0]?.day).toBe(1);
    expect(intermediate.days[intermediate.days.length - 1]?.day).toBe(45);
  });
});
