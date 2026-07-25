import { describe, expect, it } from "vitest";
import {
  createSeededRandom,
  seededShuffle,
  shuffleQuizQuestions,
  type QuizQuestion,
} from "@/lib/learning/quiz-shuffle";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    question: "First?",
    options: ["wrong 1", "correct 1", "wrong 2", "wrong 3"],
    correctIndex: 1,
    explanation: "correct 1",
  },
  {
    id: "q2",
    question: "Second?",
    options: ["correct 2", "wrong 1", "wrong 2", "wrong 3"],
    correctIndex: 0,
    explanation: "correct 2",
  },
  {
    id: "q3",
    question: "Third?",
    options: ["wrong 1", "wrong 2", "wrong 3", "correct 3"],
    correctIndex: 3,
    explanation: "correct 3",
  },
];

describe("quiz shuffling", () => {
  it("is deterministic for one attempt and changes with a different attempt seed", () => {
    const first = shuffleQuizQuestions(questions, "attempt-one");
    const repeated = shuffleQuizQuestions(questions, "attempt-one");
    const second = shuffleQuizQuestions(questions, "attempt-two");

    expect(repeated).toEqual(first);
    expect(second).not.toEqual(first);
  });

  it("keeps every correct answer mapped after option and question shuffling", () => {
    const expectedAnswers = new Map(
      questions.map((question) => [question.id, question.options[question.correctIndex]])
    );
    const shuffled = shuffleQuizQuestions(questions, "answer-mapping");

    expect(shuffled.map((question) => question.id).sort()).toEqual(["q1", "q2", "q3"]);
    for (const question of shuffled) {
      expect(question.options[question.correctIndex]).toBe(expectedAnswers.get(question.id));
      expect(question.options).toHaveLength(4);
    }
  });

  it("never generates negative or out-of-range shuffle indexes", () => {
    const random = createSeededRandom("2-Python Fundamentals for AI");
    for (let index = 0; index < 1_000; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }

    const values = Array.from({ length: 100 }, (_, index) => index);
    const shuffled = seededShuffle(values, createSeededRandom("negative-hash-regression"));
    expect([...shuffled].sort((a, b) => a - b)).toEqual(values);
  });
});
