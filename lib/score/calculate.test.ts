import { describe, expect, it } from "vitest";
import { calculateCalibiAiScore, communityDecayMultiplier } from "./calculate";

describe("calculateCalibiAiScore", () => {
  it("only counts verified non-flagged project artifacts", () => {
    const score = calculateCalibiAiScore({
      projects: [
        { verified: true, pointsAwarded: 120, originalityStatus: "passed" },
        { verified: false, pointsAwarded: 200, originalityStatus: "passed" },
        { verified: true, pointsAwarded: 100, originalityStatus: "flagged" }
      ],
      verifiedSkillsCount: 0,
      completedModulesCount: 0,
      totalModulesCount: 0,
      communityRawPoints: 0,
      recognitionRawPoints: 0,
      now: new Date("2026-07-18")
    });
    expect(score.projects_pts).toBe(120);
    expect(score.flagged).toBe(true);
  });

  it("caps weighted pillars and maps tiers deterministically", () => {
    const score = calculateCalibiAiScore({
      projects: [{ verified: true, pointsAwarded: 900, originalityStatus: "passed" }],
      verifiedSkillsCount: 20,
      completedModulesCount: 10,
      totalModulesCount: 10,
      communityRawPoints: 999,
      recognitionRawPoints: 999,
      lastActivityAt: new Date("2026-07-18"),
      now: new Date("2026-07-18")
    });
    expect(score.total).toBe(1000);
    expect(score.tier).toBe("platinum");
  });

  it("decays inactive community points", () => {
    expect(communityDecayMultiplier(new Date("2026-05-01"), new Date("2026-07-18"))).toBe(0.3);
  });
});
