import { describe, expect, it } from "vitest";

import { applyStageBand, resolveScoreBand, stageAdjustedTotal } from "./scoring";

describe("resolveScoreBand", () => {
  it("bands a beginner at 150-650", () => {
    const band = resolveScoreBand({ stage: "beginner", entryStage: "beginner" });
    expect(band).toEqual({ floor: 150, ceiling: 650 });
  });

  it("bands a promoted intermediate at 650-1000", () => {
    const band = resolveScoreBand({ stage: "intermediate", entryStage: "beginner" });
    expect(band).toEqual({ floor: 650, ceiling: 1000 });
  });

  it("scales a direct-intermediate floor with the placement score", () => {
    // Exactly at the threshold -> the minimum floor.
    const atThreshold = resolveScoreBand({
      stage: "intermediate",
      entryStage: "intermediate",
      assessmentScore: 60,
      placementThreshold: 60,
    });
    expect(atThreshold.floor).toBe(350);

    // A perfect placement -> the maximum floor.
    const perfect = resolveScoreBand({
      stage: "intermediate",
      entryStage: "intermediate",
      assessmentScore: 100,
      placementThreshold: 60,
    });
    expect(perfect.floor).toBe(500);

    // Halfway between -> halfway up the floor range.
    const middle = resolveScoreBand({
      stage: "intermediate",
      entryStage: "intermediate",
      assessmentScore: 80,
      placementThreshold: 60,
    });
    expect(middle.floor).toBe(425);
    expect(middle.ceiling).toBe(1000);
  });

  it("never drops a direct-intermediate floor below the minimum", () => {
    const band = resolveScoreBand({
      stage: "intermediate",
      entryStage: "intermediate",
      assessmentScore: 10,
      placementThreshold: 60,
    });
    expect(band.floor).toBe(350);
  });
});

describe("applyStageBand", () => {
  it("maps a zero raw score to the band floor", () => {
    expect(applyStageBand(0, { floor: 150, ceiling: 650 })).toBe(150);
  });

  it("maps a maximum raw score to the band ceiling", () => {
    expect(applyStageBand(1000, { floor: 150, ceiling: 650 })).toBe(650);
  });

  it("preserves relative ranking inside a stage", () => {
    const band = { floor: 150, ceiling: 650 };
    const low = applyStageBand(200, band);
    const high = applyStageBand(600, band);
    expect(high).toBeGreaterThan(low);
  });

  it("clamps out-of-range raw input", () => {
    const band = { floor: 150, ceiling: 650 };
    expect(applyStageBand(-50, band)).toBe(150);
    expect(applyStageBand(5000, band)).toBe(650);
  });
});

describe("stageAdjustedTotal", () => {
  it("keeps a beginner below the intermediate floor no matter how hard they work", () => {
    const beginnerMax = stageAdjustedTotal({
      rawTotal: 1000,
      stage: "beginner",
      entryStage: "beginner",
      hasRoadmap: true,
    });
    const intermediateMin = stageAdjustedTotal({
      rawTotal: 0,
      stage: "intermediate",
      entryStage: "beginner",
      hasRoadmap: true,
    });

    // This is the core guarantee from the brief: "Never give a Beginner the
    // same score as an Intermediate after only a few lessons."
    expect(beginnerMax).toBe(650);
    expect(intermediateMin).toBe(650);
    expect(beginnerMax).toBeLessThanOrEqual(intermediateMin);
  });

  it("gives a beginner a few lessons in far less than a fresh intermediate", () => {
    const beginnerEarly = stageAdjustedTotal({
      rawTotal: 80,
      stage: "beginner",
      entryStage: "beginner",
      hasRoadmap: true,
    });
    const intermediateDirect = stageAdjustedTotal({
      rawTotal: 80,
      stage: "intermediate",
      entryStage: "intermediate",
      assessmentScore: 75,
      placementThreshold: 60,
      hasRoadmap: true,
    });
    expect(beginnerEarly).toBeLessThan(intermediateDirect);
  });

  it("starts a beginner around 150, not 0", () => {
    expect(
      stageAdjustedTotal({ rawTotal: 0, stage: "beginner", entryStage: "beginner", hasRoadmap: true }),
    ).toBe(150);
  });

  it("lets a promoted intermediate reach 1000", () => {
    expect(
      stageAdjustedTotal({
        rawTotal: 1000,
        stage: "intermediate",
        entryStage: "beginner",
        hasRoadmap: true,
      }),
    ).toBe(1000);
  });

  it("does not grant a floor to a learner with no roadmap", () => {
    expect(
      stageAdjustedTotal({ rawTotal: 0, stage: "beginner", entryStage: "beginner", hasRoadmap: false }),
    ).toBe(0);
  });

  it("never exceeds 1000", () => {
    const total = stageAdjustedTotal({
      rawTotal: 999999,
      stage: "intermediate",
      entryStage: "beginner",
      hasRoadmap: true,
    });
    expect(total).toBeLessThanOrEqual(1000);
  });
});
