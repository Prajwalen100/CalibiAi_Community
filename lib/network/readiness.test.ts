import { describe, expect, it } from "vitest";
import {
  calculateNetworkReadiness,
  NON_ROADMAP_BUFFER_DAYS,
  REQUIRED_PORTFOLIO_PROJECTS,
  type NetworkReadinessInput,
} from "./readiness";

const base: NetworkReadinessInput = {
  currentScore: 642,
  totalRoadmapDays: 45,
  completedRoadmapDays: 10,
  verifiedProjectsCount: 2,
  averageProjectScore: null,
  hasGithubPortfolio: false,
  hasCapstone: false,
};

describe("calculateNetworkReadiness", () => {
  it("estimates remaining roadmap days plus the non-roadmap buffer", () => {
    const r = calculateNetworkReadiness(base);

    expect(r.remainingRoadmapDays).toBe(35);
    expect(r.estimatedDaysToUnlock).toBe(35 + NON_ROADMAP_BUFFER_DAYS);
    expect(r.estimatedDaysToUnlock).toBe(55);
  });

  it("still budgets the buffer once the roadmap is finished", () => {
    const r = calculateNetworkReadiness({
      ...base,
      completedRoadmapDays: 45,
    });

    expect(r.remainingRoadmapDays).toBe(0);
    expect(r.estimatedDaysToUnlock).toBe(NON_ROADMAP_BUFFER_DAYS);
  });

  it("does not mark the roadmap complete while days remain", () => {
    const r = calculateNetworkReadiness({
      ...base,
      completedRoadmapDays: 44,
    });

    expect(r.isRoadmapComplete).toBe(false);
  });

  it("never reports a roadmap as complete when none is assigned", () => {
    const r = calculateNetworkReadiness({
      ...base,
      totalRoadmapDays: 0,
      completedRoadmapDays: 0,
    });

    expect(r.isRoadmapComplete).toBe(false);
    expect(r.remainingRoadmapDays).toBe(0);
  });

  it("marks the roadmap complete only when every day is done", () => {
    const r = calculateNetworkReadiness({
      ...base,
      completedRoadmapDays: 45,
    });

    expect(r.isRoadmapComplete).toBe(true);
  });

  it("clamps completed days that exceed the roadmap length", () => {
    const r = calculateNetworkReadiness({
      ...base,
      completedRoadmapDays: 99,
    });

    expect(r.completedRoadmapDays).toBe(45);
    expect(r.remainingRoadmapDays).toBe(0);
  });

  it("requires 12 verified projects for a complete portfolio", () => {
    expect(REQUIRED_PORTFOLIO_PROJECTS).toBe(12);

    const r = calculateNetworkReadiness(base);
    expect(r.requiredProjects).toBe(12);
    expect(r.remainingProjects).toBe(10);
    expect(r.isPortfolioComplete).toBe(false);

    const done = calculateNetworkReadiness({
      ...base,
      verifiedProjectsCount: 12,
    });
    expect(done.isPortfolioComplete).toBe(true);
    expect(done.remainingProjects).toBe(0);
  });

  it("converts the 0-100 project score to a rating out of 10", () => {
    const r = calculateNetworkReadiness({ ...base, averageProjectScore: 88 });

    expect(r.averageProjectRating).toBe(8.8);
    expect(r.meetsRatingBar).toBe(true);

    const low = calculateNetworkReadiness({ ...base, averageProjectScore: 72 });
    expect(low.averageProjectRating).toBe(7.2);
    expect(low.meetsRatingBar).toBe(false);
  });

  it("treats a missing project score as not meeting the rating bar", () => {
    const r = calculateNetworkReadiness(base);

    expect(r.averageProjectRating).toBeNull();
    expect(r.meetsRatingBar).toBe(false);
  });

  it("derives the remaining score and percentage from the talent score", () => {
    const r = calculateNetworkReadiness(base);

    expect(r.requiredScore).toBe(850);
    expect(r.remainingScore).toBe(208);
    expect(r.scorePercent).toBe(64);
  });

  it("clamps the remaining score at zero once qualified", () => {
    const r = calculateNetworkReadiness({ ...base, currentScore: 900 });

    expect(r.remainingScore).toBe(0);
    expect(r.scorePercent).toBe(90);
  });

  it("counts completed requirements out of seven", () => {
    const none = calculateNetworkReadiness(base);
    expect(none.totalRequirements).toBe(7);
    expect(none.completedRequirements).toBe(0);

    const most = calculateNetworkReadiness({
      currentScore: 900,
      totalRoadmapDays: 45,
      completedRoadmapDays: 45,
      verifiedProjectsCount: 12,
      averageProjectScore: 92,
      hasGithubPortfolio: true,
      hasCapstone: true,
    });
    // Everything except the gated AI technical interview.
    expect(most.completedRequirements).toBe(6);
  });
});
