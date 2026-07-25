import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ROLE_DETAILS, type LearningRole } from "@/lib/learning/content";
import type { QuizQuestion } from "@/lib/learning/quiz-shuffle";

const QuizSourceQuestionSchema = z
  .object({
    question: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2),
    answer: z.union([z.string().trim().min(1), z.number().int().nonnegative()]),
    explanation: z.string().trim().min(1).optional(),
  })
  .superRefine((question, context) => {
    const correctIndex =
      typeof question.answer === "number"
        ? question.answer
        : question.options.indexOf(question.answer);

    if (correctIndex < 0 || correctIndex >= question.options.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answer"],
        message: "The answer must identify one of the supplied options.",
      });
    }

    if (new Set(question.options).size !== question.options.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Quiz options must be unique.",
      });
    }
  });

const RoadmapQuizContentSchema = z.object({
  roadmap: z.object({
    title: z.string().trim().min(1),
    role: z.string().trim().min(1),
    level: z.string().trim().min(1),
    total_days: z.number().int().positive(),
  }),
  days: z
    .array(
      z.object({
        day: z.number().int().positive(),
        title: z.string().trim().min(1),
        quiz: z.array(QuizSourceQuestionSchema).min(1),
      })
    )
    .min(1),
});

type ParsedRoadmapQuizContent = z.infer<typeof RoadmapQuizContentSchema>;
type RoadmapLevel = "beginner" | "intermediate";

const cache = new Map<string, ParsedRoadmapQuizContent>();

export function parseRoadmapQuizContent(source: unknown): ParsedRoadmapQuizContent {
  const content = RoadmapQuizContentSchema.parse(source);

  if (content.roadmap.total_days !== content.days.length) {
    throw new Error(
      `Roadmap declares ${content.roadmap.total_days} days but contains ${content.days.length}.`
    );
  }

  content.days.forEach((day, index) => {
    if (day.day !== index + 1) {
      throw new Error(`Roadmap day ${index + 1} is missing or out of order.`);
    }
  });

  return content;
}

function loadRoadmapQuizContent(
  role: LearningRole,
  level: RoadmapLevel
): ParsedRoadmapQuizContent {
  const fileName = ROLE_DETAILS[role].roadmap[level];
  const cached = cache.get(fileName);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "content", "roadmap", fileName);
  const source = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  const content = parseRoadmapQuizContent(source);
  cache.set(fileName, content);
  return content;
}

export function getRoadmapQuiz(
  role: LearningRole,
  level: RoadmapLevel,
  dayNumber: number
): { dayNumber: number; dayTitle: string; questions: QuizQuestion[] } | null {
  if (!Number.isInteger(dayNumber) || dayNumber < 1) return null;

  const day = loadRoadmapQuizContent(role, level).days.find(
    (candidate) => candidate.day === dayNumber
  );
  if (!day) return null;

  return {
    dayNumber: day.day,
    dayTitle: day.title,
    questions: day.quiz.map((question, index) => {
      const correctIndex =
        typeof question.answer === "number"
          ? question.answer
          : question.options.indexOf(question.answer);
      const correctAnswer = question.options[correctIndex]!;

      return {
        id: `${role}-${level}-day-${day.day}-q-${index + 1}`,
        question: question.question,
        options: question.options,
        correctIndex,
        explanation:
          question.explanation ?? `The correct answer is: ${correctAnswer}`,
      };
    }),
  };
}
