import { describe, expect, it } from "vitest";
import { LEARNING_ROLES } from "@/lib/learning/content";
import {
  getRoadmapQuiz,
  parseRoadmapQuizContent,
} from "@/lib/learning/roadmap-quiz";

describe("roadmap quiz content", () => {
  it("loads valid multiple-choice quizzes for every day, level, and role", () => {
    for (const role of LEARNING_ROLES) {
      for (const level of ["beginner", "intermediate"] as const) {
        for (let day = 1; day <= 45; day += 1) {
          const quiz = getRoadmapQuiz(role, level, day);
          expect(quiz, `${role}/${level}/day-${day}`).not.toBeNull();
          expect(quiz!.questions.length).toBeGreaterThan(0);

          for (const question of quiz!.questions) {
            expect(question.question.length).toBeGreaterThan(0);
            expect(question.options.length).toBeGreaterThanOrEqual(2);
            expect(question.correctIndex).toBeGreaterThanOrEqual(0);
            expect(question.correctIndex).toBeLessThan(question.options.length);
            expect(question.options[question.correctIndex].length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("rejects the string-only quiz shape that caused the quiz page failure", () => {
    expect(() =>
      parseRoadmapQuizContent({
        roadmap: { title: "Broken", role: "AI", level: "Beginner", total_days: 1 },
        days: [{ day: 1, title: "Broken day", quiz: ["What is the answer?"] }],
      })
    ).toThrow();
  });

  it("rejects an answer that is not present in its options", () => {
    expect(() =>
      parseRoadmapQuizContent({
        roadmap: { title: "Broken", role: "AI", level: "Beginner", total_days: 1 },
        days: [
          {
            day: 1,
            title: "Broken day",
            quiz: [
              {
                question: "What is the answer?",
                options: ["A", "B"],
                answer: "C",
              },
            ],
          },
        ],
      })
    ).toThrow(/answer/i);
  });
});
