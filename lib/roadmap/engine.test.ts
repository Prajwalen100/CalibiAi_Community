import { describe, expect, it } from "vitest";

import {
  computeJourneyState,
  countUnlockedDays,
  currentDayForStage,
  isStageComplete,
  resolveStageForScore,
  selectCurrentWeekTarget,
  selectRecommendedActions,
  selectTodaysFocus,
  stageOffset,
  stagesForEntry,
  weekForDay,
  weeksForDays,
} from "./engine";
import type { DashboardDay, StageProgressRow, WeeklyTarget } from "./types";

const BEGINNER_DAYS = 45;
const INTERMEDIATE_DAYS = 45;

/** Progress rows with days 1..n marked completed. */
function completedThrough(n: number): StageProgressRow[] {
  return Array.from({ length: BEGINNER_DAYS }, (_, index) => ({
    day: index + 1,
    status: index + 1 <= n ? "completed" : "locked",
  }));
}

describe("resolveStageForScore", () => {
  it("places below the threshold on beginner", () => {
    expect(resolveStageForScore(59, 60)).toBe("beginner");
    expect(resolveStageForScore(0, 60)).toBe("beginner");
  });

  it("places at or above the threshold on intermediate", () => {
    expect(resolveStageForScore(60, 60)).toBe("intermediate");
    expect(resolveStageForScore(95, 60)).toBe("intermediate");
  });

  it("honours a configured threshold rather than a hardcoded one", () => {
    expect(resolveStageForScore(70, 80)).toBe("beginner");
    expect(resolveStageForScore(80, 80)).toBe("intermediate");
    expect(resolveStageForScore(35, 30)).toBe("intermediate");
  });

  it("defaults to beginner for missing or invalid scores", () => {
    expect(resolveStageForScore(null, 60)).toBe("beginner");
    expect(resolveStageForScore(undefined, 60)).toBe("beginner");
    expect(resolveStageForScore(Number.NaN, 60)).toBe("beginner");
  });
});

describe("week maths", () => {
  it("maps days to 7-day weeks", () => {
    expect(weekForDay(1)).toBe(1);
    expect(weekForDay(7)).toBe(1);
    expect(weekForDay(8)).toBe(2);
    expect(weekForDay(45)).toBe(7);
    expect(weekForDay(90)).toBe(13);
  });

  it("derives total weeks, rounding up a partial final week", () => {
    expect(weeksForDays(45)).toBe(7);
    expect(weeksForDays(90)).toBe(13);
    expect(weeksForDays(0)).toBe(0);
  });
});

describe("stage sequencing", () => {
  it("gives a beginner-entry learner both stages", () => {
    expect(stagesForEntry("beginner")).toEqual(["beginner", "intermediate"]);
  });

  it("gives a direct-intermediate learner only one stage", () => {
    expect(stagesForEntry("intermediate")).toEqual(["intermediate"]);
  });

  it("offsets only the second stage of a beginner journey", () => {
    expect(stageOffset("beginner", "beginner", 45)).toBe(0);
    expect(stageOffset("beginner", "intermediate", 45)).toBe(45);
    // A direct-intermediate learner's day 1 is overall day 1, not day 46.
    expect(stageOffset("intermediate", "intermediate", 45)).toBe(0);
  });
});

describe("currentDayForStage", () => {
  it("starts at day 1 with no progress", () => {
    expect(currentDayForStage(45, [])).toBe(1);
  });

  it("returns the first incomplete day", () => {
    expect(currentDayForStage(45, completedThrough(12))).toBe(13);
  });

  it("pins to the last day once the stage is finished", () => {
    expect(currentDayForStage(45, completedThrough(45))).toBe(45);
  });

  it("returns the first gap when days are completed out of order", () => {
    const progress: StageProgressRow[] = [
      { day: 1, status: "completed" },
      { day: 3, status: "completed" },
    ];
    expect(currentDayForStage(45, progress)).toBe(2);
  });
});

describe("isStageComplete", () => {
  it("is false while any day remains", () => {
    expect(isStageComplete(45, completedThrough(44))).toBe(false);
  });

  it("is true only when every day is completed", () => {
    expect(isStageComplete(45, completedThrough(45))).toBe(true);
  });

  it("is false for an empty roadmap rather than vacuously true", () => {
    expect(isStageComplete(0, [])).toBe(false);
  });
});

describe("computeJourneyState — beginner entry", () => {
  const base = {
    entryStage: "beginner" as const,
    currentStage: "beginner" as const,
    stageTotalDays: BEGINNER_DAYS,
    beginnerTotalDays: BEGINNER_DAYS,
  };

  it("reports a 90-day, 14-week journey from day one", () => {
    const state = computeJourneyState({ ...base, stageProgress: [] });
    expect(state.overallJourneyDays).toBe(90);
    // Weeks concatenate per stage (7 + 7), so the journey is 14 weeks.
    expect(state.overallJourneyWeeks).toBe(14);
    expect(state.currentOverallDay).toBe(1);
    expect(state.currentStageDay).toBe(1);
    expect(state.currentStage).toBe("beginner");
  });

  it("keeps stage and overall day identical during stage one", () => {
    const state = computeJourneyState({ ...base, stageProgress: completedThrough(10) });
    expect(state.currentStageDay).toBe(11);
    expect(state.currentOverallDay).toBe(11);
    expect(state.currentStageWeek).toBe(2);
    expect(state.currentOverallWeek).toBe(2);
  });

  it("tracks stage and overall progress separately", () => {
    const state = computeJourneyState({ ...base, stageProgress: completedThrough(45) });
    expect(state.stageProgressPercent).toBe(100);
    // 45 of 90 overall days.
    expect(state.overallProgressPercent).toBe(50);
    expect(state.overallRemainingDays).toBe(45);
  });

  it("flags promotion once the beginner stage completes", () => {
    const state = computeJourneyState({ ...base, stageProgress: completedThrough(45) });
    expect(state.currentStageCompleted).toBe(true);
    expect(state.promotionTarget).toBe("intermediate");
    expect(state.journeyCompleted).toBe(false);
    expect(state.beginnerCompleted).toBe(true);
  });

  it("does not promote before the final day is done", () => {
    const state = computeJourneyState({ ...base, stageProgress: completedThrough(44) });
    expect(state.currentStageCompleted).toBe(false);
    expect(state.promotionTarget).toBeNull();
  });
});

describe("computeJourneyState — after promotion to intermediate", () => {
  const promoted = {
    entryStage: "beginner" as const,
    currentStage: "intermediate" as const,
    stageTotalDays: INTERMEDIATE_DAYS,
    beginnerTotalDays: BEGINNER_DAYS,
    beginnerCompletedDays: BEGINNER_DAYS,
  };

  it("continues the overall day into the 46-90 range", () => {
    const state = computeJourneyState({ ...promoted, stageProgress: [] });
    expect(state.currentStageDay).toBe(1);
    expect(state.currentOverallDay).toBe(46);
    expect(state.overallJourneyDays).toBe(90);
  });

  it("continues the overall week into the 8-14 range", () => {
    const state = computeJourneyState({ ...promoted, stageProgress: [] });
    expect(state.currentStageWeek).toBe(1);
    // Stage-concatenated: Intermediate week 1 is overall week 8, not week 7.
    expect(state.currentOverallWeek).toBe(8);
    expect(state.overallJourneyWeeks).toBe(14);
  });

  it("ends the journey on overall week 14", () => {
    const state = computeJourneyState({ ...promoted, stageProgress: completedThrough(45) });
    expect(state.currentStageWeek).toBe(7);
    expect(state.currentOverallWeek).toBe(14);
  });

  it("counts completed beginner days toward overall progress", () => {
    const state = computeJourneyState({ ...promoted, stageProgress: completedThrough(10) });
    expect(state.stageCompletedDays).toBe(10);
    expect(state.overallCompletedDays).toBe(55);
    expect(state.overallProgressPercent).toBe(61);
  });

  it("completes the journey when the intermediate stage finishes", () => {
    const state = computeJourneyState({ ...promoted, stageProgress: completedThrough(45) });
    expect(state.journeyCompleted).toBe(true);
    expect(state.intermediateCompleted).toBe(true);
    expect(state.beginnerCompleted).toBe(true);
    expect(state.promotionTarget).toBeNull();
    expect(state.overallProgressPercent).toBe(100);
  });

  it("reflects a reopened beginner day in overall progress", () => {
    const state = computeJourneyState({
      ...promoted,
      beginnerCompletedDays: 44,
      stageProgress: completedThrough(5),
    });
    expect(state.overallCompletedDays).toBe(49);
  });
});

describe("computeJourneyState — direct intermediate entry", () => {
  const direct = {
    entryStage: "intermediate" as const,
    currentStage: "intermediate" as const,
    stageTotalDays: INTERMEDIATE_DAYS,
    beginnerTotalDays: 0,
  };

  it("reports a 45-day journey, not 90", () => {
    const state = computeJourneyState({ ...direct, stageProgress: [] });
    expect(state.overallJourneyDays).toBe(45);
    // A direct-intermediate journey is 7 weeks, never 14.
    expect(state.overallJourneyWeeks).toBe(7);
    expect(state.stages).toEqual(["intermediate"]);
  });

  it("numbers days 1-45 rather than 46-90", () => {
    const state = computeJourneyState({ ...direct, stageProgress: completedThrough(3) });
    expect(state.currentStageDay).toBe(4);
    expect(state.currentOverallDay).toBe(4);
    expect(state.currentOverallWeek).toBe(1);
  });

  it("never claims the beginner stage was completed", () => {
    const state = computeJourneyState({ ...direct, stageProgress: completedThrough(45) });
    expect(state.beginnerCompleted).toBe(false);
    expect(state.intermediateCompleted).toBe(true);
    expect(state.journeyCompleted).toBe(true);
    // There is no further stage to promote into.
    expect(state.promotionTarget).toBeNull();
  });
});

describe("content selectors", () => {
  const days: DashboardDay[] = Array.from({ length: 45 }, (_, index) => ({
    day: index + 1,
    week: weekForDay(index + 1),
    title: `Day ${index + 1}`,
    objectives: [],
    topics: [],
    estimated_time: "2-3 hours",
    difficulty: "Beginner",
    skills_gained: [],
    resources: { youtube: [], docs: [] },
    has_quiz: false,
  }));

  it("selects today's focus from the current stage's JSON", () => {
    expect(selectTodaysFocus(days, 12)?.title).toBe("Day 12");
    expect(selectTodaysFocus(days, 999)).toBeNull();
  });

  it("recommends the upcoming days from the current day", () => {
    const actions = selectRecommendedActions(days, 5, 4);
    expect(actions.map((day) => day.day)).toEqual([5, 6, 7, 8]);
  });

  it("backfills near the end of a stage so the list is never sparse", () => {
    const actions = selectRecommendedActions(days, 44, 4);
    expect(actions).toHaveLength(4);
    expect(actions.slice(0, 2).map((day) => day.day)).toEqual([44, 45]);
  });

  it("selects the weekly target for the current stage week", () => {
    const targets: WeeklyTarget[] = [
      { week: 1, title: "Week 1", focus: "a", days: [1], keyTopics: [], milestones: [] },
      { week: 2, title: "Week 2", focus: "b", days: [8], keyTopics: [], milestones: [] },
    ];
    expect(selectCurrentWeekTarget(targets, 2)?.title).toBe("Week 2");
    expect(selectCurrentWeekTarget(targets, 9)).toBeNull();
  });
});

describe("countUnlockedDays", () => {
  it("unlocks completed days plus the current one", () => {
    const state = computeJourneyState({
      entryStage: "beginner",
      currentStage: "beginner",
      stageTotalDays: 45,
      beginnerTotalDays: 45,
      stageProgress: completedThrough(10),
    });
    expect(countUnlockedDays(state)).toBe(11);
  });

  it("never exceeds the stage length", () => {
    const state = computeJourneyState({
      entryStage: "beginner",
      currentStage: "beginner",
      stageTotalDays: 45,
      beginnerTotalDays: 45,
      stageProgress: completedThrough(45),
    });
    expect(countUnlockedDays(state)).toBe(45);
  });
});
