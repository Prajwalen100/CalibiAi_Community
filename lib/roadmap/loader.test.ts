import { describe, expect, it } from "vitest";

import { LEARNING_ROLES, ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";

import { loadRoadmap, roadmapFileName, roadmapTotalDays, __clearRoadmapCache } from "./loader";
import { ROADMAP_STAGES } from "./types";

/**
 * These run against the REAL JSON files in content/roadmap/. They are the
 * guard that the mapping engine stays in sync with the content that already
 * ships in the repository — no roadmap data is created here.
 */
describe("roadmap loader — existing content files", () => {
  it("resolves a distinct file for every role and stage", () => {
    const seen = new Set<string>();
    for (const role of LEARNING_ROLES as readonly LearningRole[]) {
      for (const stage of ROADMAP_STAGES) {
        const fileName = roadmapFileName(role, stage);
        expect(fileName).toMatch(/\.json$/);
        // Every (role, stage) pair must map to its own file: a duplicate here
        // would silently serve one stage's content for another.
        expect(seen.has(fileName)).toBe(false);
        seen.add(fileName);
      }
    }
    expect(seen.size).toBe(LEARNING_ROLES.length * ROADMAP_STAGES.length);
  });

  it.each(LEARNING_ROLES as readonly LearningRole[])("loads both stages for %s", (role) => {
    for (const stage of ROADMAP_STAGES) {
      const roadmap = loadRoadmap(role, stage);

      expect(roadmap.stage).toBe(stage);
      expect(roadmap.days.length).toBeGreaterThan(0);
      expect(roadmap.totalDays).toBe(roadmap.days.length);

      // Days must be a contiguous 1..N sequence — the engine's day maths and
      // the progress seeding both rely on it.
      roadmap.days.forEach((day, index) => {
        expect(day.day).toBe(index + 1);
        expect(day.title.length).toBeGreaterThan(0);
      });

      // Weeks are derived, never authored.
      expect(roadmap.totalWeeks).toBe(Math.ceil(roadmap.totalDays / 7));
      expect(roadmap.weeklyTargets).toHaveLength(roadmap.totalWeeks);
    }
  });

  it("reports 45 days per stage, giving a 90-day beginner journey", () => {
    for (const role of LEARNING_ROLES as readonly LearningRole[]) {
      const beginner = roadmapTotalDays(role, "beginner");
      const intermediate = roadmapTotalDays(role, "intermediate");
      expect(beginner).toBe(45);
      expect(intermediate).toBe(45);
      expect(beginner + intermediate).toBe(90);
    }
  });

  it("assigns each day to the correct 7-day week", () => {
    const roadmap = loadRoadmap("ai_engineer", "beginner");
    expect(roadmap.days[0]?.week).toBe(1);
    expect(roadmap.days[6]?.week).toBe(1);
    expect(roadmap.days[7]?.week).toBe(2);
    expect(roadmap.days[44]?.week).toBe(7);
  });

  it("keeps the beginner and intermediate content genuinely different", () => {
    const beginner = loadRoadmap("ai_engineer", "beginner");
    const intermediate = loadRoadmap("ai_engineer", "intermediate");

    expect(beginner.fileName).not.toBe(intermediate.fileName);
    expect(beginner.roadmap.level.toLowerCase()).toContain("beginner");
    expect(intermediate.roadmap.level.toLowerCase()).toContain("intermediate");

    // A promoted learner must actually receive new material.
    const beginnerTitles = beginner.days.map((day) => day.title);
    const intermediateTitles = intermediate.days.map((day) => day.title);
    expect(beginnerTitles).not.toEqual(intermediateTitles);
  });

  it("matches the filenames declared in the role registry", () => {
    for (const role of LEARNING_ROLES as readonly LearningRole[]) {
      for (const stage of ROADMAP_STAGES) {
        expect(loadRoadmap(role, stage).fileName).toBe(ROLE_DETAILS[role].roadmap[stage]);
      }
    }
  });

  it("returns the identical cached instance on repeat loads", () => {
    __clearRoadmapCache();
    const first = loadRoadmap("genai_engineer", "beginner");
    const second = loadRoadmap("genai_engineer", "beginner");
    // Same object reference: the dashboard hot path must not re-parse JSON.
    expect(first).toBe(second);
  });
});
