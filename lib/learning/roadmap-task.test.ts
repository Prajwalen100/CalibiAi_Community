import { describe, expect, it } from "vitest";
import { LEARNING_ROLES } from "@/lib/learning/content";
import {
  getRoadmapTask,
  parseRoadmapTaskContent,
} from "@/lib/learning/roadmap-task";
import { ROADMAP_TASK_TYPES } from "@/lib/learning/task-types";

describe("roadmap AI lab tasks", () => {
  it("loads all three assessment types for every role, level, and day", () => {
    let taskCount = 0;
    for (const role of LEARNING_ROLES) {
      for (const level of ["beginner", "intermediate"] as const) {
        for (let day = 1; day <= 45; day += 1) {
          for (const taskType of ROADMAP_TASK_TYPES) {
            const task = getRoadmapTask(role, level, day, taskType);
            expect(task, `${role}/${level}/day-${day}/${taskType}`).not.toBeNull();
            expect(task!.taskDescription.length).toBeGreaterThan(10);
            expect(task!.starterCode.length).toBeGreaterThan(10);
            expect(task!.objectives.length).toBeGreaterThan(0);
            taskCount += 1;
          }
        }
      }
    }
    expect(taskCount).toBe(1_080);
  });

  it("maps tool-based assignments to the correct lab instead of a generic written response", () => {
    const task = getRoadmapTask("ai_engineer", "beginner", 6, "assignment");
    expect(task?.taskType).toBe("assignment");
    expect(task?.taskDescription).toMatch(/Jupyter notebook/i);
    expect(task?.suggestedLanguage).toBe("python");
    expect(task?.starterCode).toMatch(/import pandas as pd/);
  });

  it("rejects roadmap days missing an assessable task", () => {
    expect(() =>
      parseRoadmapTaskContent({
        roadmap: { title: "Broken", total_days: 1 },
        days: [
          {
            day: 1,
            title: "Broken day",
            objectives: ["Learn"],
            topics: ["Topic"],
            practical_task: "Only one task exists here.",
          },
        ],
      })
    ).toThrow();
  });
});
