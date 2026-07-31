import { describe, expect, it } from "vitest";
import { calculateCalibiAiScore, calculateReadingEngagement, communityDecayMultiplier } from "./calculate";

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
      readingScore: 100,
      quizAverage: 100,
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

describe("calculateReadingEngagement", () => {
  it("is 0% when nothing has been read yet, even with content available", () => {
    const pct = calculateReadingEngagement({
      articlesRead: 0,
      totalArticles: 45,
      blogPostsRead: 0,
      totalBlogPosts: 10,
      modulesCompleted: 0,
      totalModules: 503,
    });
    expect(pct).toBe(0);
  });

  it("is 0% (not NaN/Infinity) when there is no readable content at all", () => {
    const pct = calculateReadingEngagement({
      articlesRead: 0,
      totalArticles: 0,
      blogPostsRead: 0,
      totalBlogPosts: 0,
      modulesCompleted: 0,
      totalModules: 0,
    });
    expect(pct).toBe(0);
  });

  it("combines articles, blog posts, and learning-hub modules into one pool", () => {
    // 1 article + 1 blog post + 1 module read out of (2 + 2 + 6) total = 3/10 = 30%
    const pct = calculateReadingEngagement({
      articlesRead: 1,
      totalArticles: 2,
      blogPostsRead: 1,
      totalBlogPosts: 2,
      modulesCompleted: 1,
      totalModules: 6,
    });
    expect(pct).toBe(30);
  });

  it("each additional distinct read nudges the percentage up (never down)", () => {
    const base = calculateReadingEngagement({
      articlesRead: 10,
      totalArticles: 100,
      blogPostsRead: 0,
      totalBlogPosts: 0,
      modulesCompleted: 0,
      totalModules: 0,
    });
    const afterOneMore = calculateReadingEngagement({
      articlesRead: 11,
      totalArticles: 100,
      blogPostsRead: 0,
      totalBlogPosts: 0,
      modulesCompleted: 0,
      totalModules: 0,
    });
    expect(afterOneMore).toBeGreaterThan(base);
  });

  it("reaches exactly 100% once everything published has been read", () => {
    const pct = calculateReadingEngagement({
      articlesRead: 45,
      totalArticles: 45,
      blogPostsRead: 10,
      totalBlogPosts: 10,
      modulesCompleted: 503,
      totalModules: 503,
    });
    expect(pct).toBe(100);
  });

  it("never exceeds 100% even with a stale/inconsistent read count", () => {
    const pct = calculateReadingEngagement({
      articlesRead: 999,
      totalArticles: 45,
      blogPostsRead: 0,
      totalBlogPosts: 0,
      modulesCompleted: 0,
      totalModules: 0,
    });
    expect(pct).toBe(100);
  });
});

