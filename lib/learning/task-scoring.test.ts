import { describe, expect, it } from "vitest";
import {
  motivationForTaskScore,
  pointsForTaskScore,
  TASK_PASS_SCORE,
} from "@/lib/learning/task-scoring";

describe("roadmap task scoring", () => {
  it("awards points only for passing work and caps the award", () => {
    expect(pointsForTaskScore(TASK_PASS_SCORE - 1)).toBe(0);
    expect(pointsForTaskScore(60)).toBe(1);
    expect(pointsForTaskScore(75)).toBe(3);
    expect(pointsForTaskScore(100)).toBe(5);
    expect(pointsForTaskScore(500)).toBe(5);
  });

  it("returns encouraging guidance for failed and passed attempts", () => {
    expect(motivationForTaskScore(30)).toMatch(/first step/i);
    expect(motivationForTaskScore(50)).toMatch(/resubmit/i);
    expect(motivationForTaskScore(80)).toMatch(/excellent/i);
  });
});
